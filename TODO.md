# Code

- [ ] Clean up our Main function, it's kinda turning into a rats nest. It's great that I was able to hack it together
      quickly, but it's kinda not great now. Needs improvement.
- [ ] Write some fucken tests my man, this shit is hanging in the wind unprotected right now. This is a relatively small
      codebase as of the time of this TODO note, it's best to start writing them sooner rather than later.
- [ ] Look into minifying our `HTML` and `CSS` output, ideally we want the `gzipped` packet to be sub 14kb so the entire
      page is transmitted during the first tcp roundtrip.

# Styling


# CI/CD

- [ ] Get some gitlab-ci going here so we can do automated deployments.
  - Probably the best way to do this is create an Ansible playbook that we then call from our CI engine. This will make
    it easy to deploy from other devices besides the CI if needed and help with debugging, updates, etc. You know the
    drill.
- [ ] Automate some linting, formatting, and auditing of the codebase
  - `rustfmt` can be used for formatting
  - `clippy` can be used for linting
  - `cargo audit` can be used for auditing