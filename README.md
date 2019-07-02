# Issue pull requests from Sourcegraph codemod/diff views.

The fields below can be set in your configuration. If they are not set, and do not have a sensible default, you'll get an input prompt when issuing a PR (e.g., for a GH access token, author name, etc.). While the PR title and commit will probably differ, it's a good idea to set the things that likely won't change:

```
  "pr.gitHubAccessToken": "<GitHub token>",
  "pr.authorName": "Rijnard van Tonder",
  "pr.authorEmail": "rvantonder@gmail.com",
  "pr.description": "",
``` 

```ts
export interface Overrides {
    /**
     * An input box is prompted if not specified.
     */
    'pr.gitHubAccessToken': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.title': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.description': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.authorName': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.authorEmail': string

    /**
     * E.g., my-pr-branch. An input box is prompted if not specified.
     */
    'pr.sourceBranch': string

    /**
     * Default is 'master' if not specified.
     */
    'pr.destinationBranch': string

    /**
     * A PR is a draft by default. Set this to false to issue real PRs.
     */
    'pr.isDraft': boolean

    /**
     * Override sourcegraph URL (useful to for testing against Docker hosts).
     */
    'pr.sourcegraphUrl': string
}
```
