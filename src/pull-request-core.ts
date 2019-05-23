import Octokit, { GitUpdateRefResponse } from '@octokit/rest';

import {
    PullRequest,
    PullRequestWithChangesetCommit,
    SourceFile
} from './types';

export function issuePullRequestWithToken(
    { pullRequest, changesetCommit }: PullRequestWithChangesetCommit,
    githubAccessToken: string
): Promise<Octokit.PullsCreateResponse> {
    const octokit = new Octokit({
        auth: githubAccessToken
    });

    return Promise.resolve(issuePullRequest({ pullRequest, changesetCommit }));

    function issuePullRequest({
        pullRequest: pr,
        changesetCommit: cs
    }: PullRequestWithChangesetCommit): Promise<Octokit.PullsCreateResponse> {
        return Promise.resolve(
            getCommitBranchSha(
                pr.sourceOwner,
                pr.sourceRepo,
                pr.destinationBranch,
                pr.sourceBranch
            )
                .then(commitBranchSha =>
                    createTree(
                        pr.sourceOwner,
                        pr.sourceRepo,
                        commitBranchSha,
                        cs.sourceFiles
                    )
                )
                .then(([treeSha, commitBranchSha]) =>
                    pushCommit(
                        pr.sourceOwner,
                        pr.sourceRepo,
                        pr.sourceBranch,
                        commitBranchSha,
                        treeSha,
                        cs.authorName,
                        cs.authorEmail,
                        cs.commitMessage
                    )
                )
                .then(_ => createPullRequest(pr))
        );
    }

    function createPullRequest({
        sourceOwner,
        sourceRepo,
        destinationBranch,
        sourceBranch,
        subject,
        description,
        destinationOwner,
        destinationRepo,
        maintainerCanModify,
        draft
    }: PullRequest): Promise<Octokit.PullsCreateResponse> {
        if (destinationOwner && destinationOwner !== sourceOwner) {
            destinationBranch = `${sourceOwner}:${destinationBranch}`;
        } else {
            destinationOwner = sourceOwner;
        }

        if (!destinationRepo) {
            destinationRepo = sourceRepo;
        }

        return Promise.resolve(
            octokit.pulls
                .create({
                    owner: destinationOwner,
                    repo: destinationRepo,
                    title: subject,
                    body: description,
                    head: sourceBranch,
                    base: destinationBranch,
                    maintainer_can_modify: maintainerCanModify,
                    draft
                })
                .then(({ data }) => data)
        );
    }

    /**
     * Pushes a commit of treeSha to commitBranch and returns the response.
     */
    function pushCommit(
        owner: string,
        repo: string,
        commitBranch: string,
        commitBranchSha: string,
        treeSha: string,
        authorName: string,
        authorEmail: string,
        commitMessage: string
    ): Promise<GitUpdateRefResponse> {
        return Promise.resolve(
            octokit.git
                .getCommit({
                    owner,
                    repo,
                    commit_sha: commitBranchSha
                })
                .then(({ data }) =>
                    octokit.git.createCommit({
                        owner,
                        repo,
                        message: commitMessage,
                        tree: treeSha,
                        author: {
                            name: authorName,
                            email: authorEmail,
                            date: new Date().toISOString()
                        },
                        parents: [data.sha]
                    })
                )
                .then(({ data }) =>
                    // update the branch ref to point to the created commit
                    octokit.git.updateRef({
                        owner,
                        repo,
                        ref: 'heads/' + commitBranch,
                        sha: data.sha
                    })
                )
                .then(({ data }) => data)
        );
    }

    /**
     * Creates a tree from the provided commitBranchSha ref for sourceFiles and returns the sha.
     */
    function createTree(
        owner: string,
        repo: string,
        commitBranchSha: string,
        sourceFiles: SourceFile[]
    ): Promise<string[]> {
        const tree = sourceFiles.map<Octokit.GitCreateTreeParamsTree>(
            ({ path, content }) => ({
                path,
                content,
                type: 'blob',
                mode: '100644'
            })
        );
        return Promise.resolve(
            octokit.git
                .createTree({
                    owner,
                    repo,
                    tree,
                    base_tree: commitBranchSha
                })
                .then(({ data }) => [data.sha, commitBranchSha])
        );
    }

    /** Creates a a commitBranch from baseBranch and returns the sha. */
    function createCommitBranch(
        owner: string,
        repo: string,
        baseBranch: string,
        commitBranch: string
    ): Promise<string> {
        return Promise.resolve(
            octokit.git
                .getRef({
                    owner,
                    repo,
                    ref: 'heads/' + baseBranch
                })
                .then(({ data }) =>
                    octokit.git.createRef({
                        owner,
                        repo,
                        ref: 'refs/heads/' + commitBranch,
                        sha: data.object.sha
                    })
                )
                .then(({ data }) => data.object.sha)
        );
    }

    /**
     * Returns the commit branch sha ref (the one we will PR) if it exists, or creates it from the base branch and returns it.
     */
    function getCommitBranchSha(
        owner: string,
        repo: string,
        baseBranch: string,
        commitBranch: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            octokit.git
                .getRef({
                    owner,
                    repo,
                    ref: 'heads/' + commitBranch
                })
                .then(
                    ({ data }) => {
                        // Branch exists.
                        resolve(data.object.sha);
                    },
                    ({ status: status }) => {
                        if (status === 404) {
                            // Branch does not exist; create it.
                            resolve(
                                createCommitBranch(
                                    owner,
                                    repo,
                                    baseBranch,
                                    commitBranch
                                )
                            );
                        }
                        reject(
                            'Error looking up or creating branch. Is your GitHub token authorized?'
                        );
                    }
                );
        });
    }
}
