---
title: The Withering Fucking Pain of Nix and Git Submodules
summary: Nix's Git submodule support is awful. More than awful, it's fundamentally broken.
tags:
  - nix
---

# Context

I have now spent an ungodly amount of time trying to get my Nix build for my blog to work with a Treesitter syntax parser. I am now declaring defeat. Fuck that.

The first bone to pick is that Nix's Git submodule support is utterly, *utterly*, busted. Like, see [here](https://github.com/NixOS/nix/issues/9708). That's recent relative to this post, but these sorts of issues around Git submodules are a constant affair when it comes to Nix flakes. There's one of two primary crapalicious ways of getting around this. There are more, but I'm choosing to stick to the two actually good solutions if you're dead set on using Git submodules.

# The first (and worse of the two) workaround

When you invoke `nix build`, invoke it with `nix build '.?submodules=1'` which *should* bring the git submodules along for the ride assuming they're actually checked out.

This is awful. Actually, genuinely, terrible. Now any time I want to build the given project I have to remember to add in some extra arguments in my invocations to ensure dependencies are pulled into the build. Just what the fuck? Why is this considered an acceptable design? Half the reason behind me using Nix in the first place is so dependencies take care of themselves and reproducibility is easily achieved. By having to remember to pass in `'.?submodules=1'`, I'm now worrying about dependencies that ideally should be handled in the code itself.

And guess what? Any downstream usage of the flake elsewhere will also now have to call all their commands with `'.?submodules=1'` as far as I can tell. Lovely. It pollutes out beyond just the single project, it screws up all of 'em.

That ain't gonna cut it, trash.

# The second (and somewhat better, but still crappy) workaround

So another way of doing this is to define an additional input in my `flake.nix` like so:

```nix
{
  inputs = {
    src-with-submodules = {
      flake = false;
      url = "git+file:./.?submodules=1";
    }
  };

  outputs = { src-with-submodules }: {
    #... building derivations and whatever else
  };
}
```

And then in all my output derivations if they need the submodules instead of referencing say a local path like `./.`, reference in the `src-with-submodules` input instead. This still kinda sucks as now I have to keep that in mind when writing any Nix modules/code and it's very much *not* typical to do that.

# My issue

I used the second approach to pull in my Git submodules. Now to be clear, my Blog, at the time of writing, is made of twine, nearly snapping twigs, duct tape, and prayers. It ain't well written at *all* and that includes the Nix flake. I admit that.

Still, even with that caveat, my `cargo run` invocation, even when fully offline after vendoring dependencies, works correctly. My precious syntax highlighting from Treesitter gets applied as expected. Under a `nix build`? Nope. Not in any way I've tried. If someone out there wants to hit me up and call me a dumbass, please feel free — but while you're doing that shoot me a solution. I'll do some downright *strange* things for a proper solution right now.

# Maintaining the Status Quo

Are my failures probably related to incompetence on my part? Yup, prob-a-lee. Still, I'm tired. So ***very*** tired of fucking with it. It's just syntax highlighting. I give up. Maybe I'll come back to it another day and finally work out how to correctly do it. For now though, fuck it. Sublime syntax highlighting will have to do.
