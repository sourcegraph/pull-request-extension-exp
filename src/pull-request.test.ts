import { issuePullRequestWithToken } from './pull-request-core'
import { ChangesetCommit, PullRequest } from './types'

const pullRequest: PullRequest = {
    sourceOwner: 'rvantonder',
    sourceRepo: 'test-auto-pr',
    destinationBranch: 'master',
    sourceBranch: 'my-feature-branch',
    subject: 'PR Title',
    description: 'PR description',
}

const changesetCommit: ChangesetCommit = {
    sourceFiles: [
        { path: 'a/b/c/hello.md', content: 'world' },
        { path: 'README.md', content: '# test-auto-pr\nblah blah' },
    ],
    authorName: 'Rijnard van Tonder',
    authorEmail: 'rvantonder@gmail.com',
    commitMessage: 'commit message',
}

test('PR fails on invalid token', () =>
    expect(issuePullRequestWithToken({ pullRequest, changesetCommit }, 'NOT_A_REAL_TOKEN')).rejects.toThrow(
        'Error looking up or creating branch. Is your GitHub token authorized?'
    ))

// Example code for issuing a real PR with a valid token.
// test('A real PR', () =>
//     issuePullRequestWithToken({ pullRequest, changesetCommit }, 'USE_A_VALID_TOKEN').then(data =>
//         expect(data).toMatch('my-feature-branch')
//     ))
