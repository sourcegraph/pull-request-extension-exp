import { issuePullRequestWithToken } from "./pull-request-core";
import { ChangesetCommit, PullRequest } from "./types";

const pullRequest: PullRequest = {
    sourceOwner: "rvantonder",
    sourceRepo: "test-auto-pr",
    destinationBranch: "master",
    sourceBranch: "my-feature-branch",
    subject: "PR Title",
    description: "PR description"
};

const changesetCommit: ChangesetCommit = {
    sourceFiles: [
        { path: "a/b/c/hello.md", content: "world" },
        { path: "README.md", content: "# test-auto-pr\nblah blah" }
    ],
    authorName: "Rijnard van Tonder",
    authorEmail: "rvantonder@gmail.com",
    commitMessage: "commit message"
};

test("PR fails on invalid token", () =>
    issuePullRequestWithToken(
        { pullRequest, changesetCommit },
        "NOT_A_REAL_TOKEN"
    ).catch(err => expect(err).toMatch('Error looking up or creating branch. Is your GitHub token authorized?')))

// test('A real PR', () =>
//    issuePullRequestWithToken({pullRequest, changesetCommit}, 'NOT_A_REAL_TOKEN').then(data =>
//        expect(data).toBe({})
//    ))
