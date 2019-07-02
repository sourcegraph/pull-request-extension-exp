import { applyPatch } from 'diff'
import * as sourcegraph from 'sourcegraph'
import { Settings } from './settings'
import { Change, Match, SourceTree } from './types'

function sourcegraphURL(): URL {
    const url =
        sourcegraph.configuration.get<Settings>().value['pr.sourcegraphUrl'] ||
        sourcegraph.internal.sourcegraphURL.toString()
    try {
        return new URL(url)
    } catch (e) {
        if ('message' in e && /Invalid URL/.test(e.message)) {
            console.error(new Error([`Invalid pr.sourcegraphUrl ${url} in your Sourcegraph settings.`].join('\n')))
        }
        throw e
    }
}

export function resolveURI(
    uri: string
): { fullRepoPath: string; rev: string; filePath: string; owner: string; repo: string } {
    const url = new URL(uri)
    if (url.protocol === 'git:') {
        const pathParts = url.pathname.match(/((\w|-)+)/g)
        if (!pathParts || pathParts.length < 2) {
            throw new Error('Expected matches on repo URI.')
        }
        return {
            fullRepoPath: (url.host + url.pathname).replace(/^\/*/, '').toLowerCase(),
            rev: url.search.slice(1).toLowerCase(),
            filePath: url.hash.slice(1),
            owner: pathParts[0],
            repo: pathParts[1],
        }
    }
    throw new Error(`unrecognized URI: ${JSON.stringify(uri)} (supported URI schemes: git)`)
}

export async function apply({ owner, repo, path, patch }: Change): Promise<string> {
    const u = sourcegraphURL()
    const codehost = 'github.com'
    const url = `${u.protocol}//${u.host}/${codehost}/${owner}/${repo}/-/raw/${path}`
    const source = await fetch(url).then(response => response.text())
    const newSource = applyPatch(source, patch)
    return newSource
}

export async function applyPatches(matches: Match[]): Promise<SourceTree[]> {
    // Group matches together for the same repo.
    const partition = matches.reduce((map, { url, body }) => {
        const { owner, repo } = resolveURI(url)
        const key = `${owner}/${repo}`
        if (!map.has(key)) {
            map.set(url, [body])
            return map
        }
        const existing = map.get(key)
        return map.set(url, existing.concat(body))
    }, new Map<string, any>())

    // Apply patches.
    const results = Array.from(partition).map(async ([url, patches]) => {
        const { filePath, owner, repo } = resolveURI(url)
        const sourceFiles = await patches.reduce(async (acc: any, body: any) => {
            // Start after '```diff\n' and stop before trailing '```'.
            const patch = body.text.slice(8, body.text.length - 3)
            const content = await apply({ owner, repo, path: filePath, patch })
            return acc.concat({ path: filePath, content })
        }, [])
        return { owner, repo, sourceFiles }
    })
    return Promise.all(results)
}

export async function runCodemodQuery(searchQuery: string): Promise<SourceTree[]> {
    const query = `query Search($query: String!) {
        search(query: $query) {
            results {
                results {
                    ... on CodemodResult {
                        __typename
                        matches {
                            url
                            body {
                                text
                            }
                        }
                    }
                }
            }
        }
    }
    `
    const gqlSearchQuery = {
        query: searchQuery,
    }
    const { data, errors } = await sourcegraph.commands.executeCommand('queryGraphQL', query, gqlSearchQuery)
    if (errors && errors.length > 0) {
        throw new Error(errors.join('\n'))
    }

    if (!data || !data.search || !data.search.results || !data.search.results.results) {
        throw new Error('No result')
    }

    const allMatches = data.search.results.results.reduce((acc: any[], result: any) => {
        if (!result.matches) {
            return acc
        }
        return acc.concat(result.matches)
    }, [])

    return applyPatches(allMatches)
}
