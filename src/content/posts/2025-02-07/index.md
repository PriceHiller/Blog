---
title: Using a Nix Attrset to specify Librewolf settings
summary: The Nix Home Manager module for Librewolf uses path-like strings for settings — I wanted to use attrsets so I set out to make it happen.
tags:
  - nix
---

# A minor nuisance is discovered

I was tinkering with my Nix config and ended up going through my [Librewolf](https://github.com/PriceHiller/dots/blob/0f3cfaa30909d425b3e68a93df47396acd4c33b1/users/price/conf/librewolf/default.nix) configuration. I realized that the settings in the [Librewolf Home Manager module](https://github.com/nix-community/home-manager/blob/master/modules/programs/librewolf.nix) do not support Nix attrsets. That bothered me.

For your eyes, here was how I had Librewolf configured during that session:

```nix
  # ... snip ...
  programs.librewolf = {
    enable = true;
    settings = {
      "webgl.disabled" = false;
      "privacy.clearOnShutdown.history" = false;
      "privacy.clearOnShutdown.downloads" = false;
      "privacy.clearOnShutdown.cookies" = false;
      "network.cookie.lifetimePolicy" = 0;
      "network.trr.mode" = 3;
      "network.trr.uri" = "https://dns.mullvad.net/dns-query";
      "network.trr.default_provider_uri" = "https://dns10.quad9.net/dns-query";
      "network.trr.strict_native_fallback" = false;
      "network.trr.retry_on_recoverable_errors" = true;
      "network.trr.disable-heuristics" = true;
      "network.trr.allow-rfc1918" = true;
    };
  };
  # ... snip ...
```

Notice all the string paths like `"network.trr.mode"`, `"network.trr.uri"`, and so on. Nix has these beautiful things called attrsets (in fact, the `programs.librewolf` stuff itself _is_ an attrset), here's an example:

```nix
{
  hello = {
    world = true;
    nested.path.item = false;
  };
}
```

Notice that the `nested.path.item` looks an awful lot like `"network.trr.mode"` and the other string paths in the Librewolf settings.

So! It got me thinking, I don't really like repeating the same `"network.trr.mode` and whatnot over and over; furthermore, those strings make it a pain to organize those settings under their parents. Meaning I can't just have all of Librewolf's network settings hanging out under a `network` top level key.

I wanted to set those paths in an attrset — I _needed_ to set those paths in an attrset.

What I wanted to do was set my Librewolf configuration like so:

```nix
  # ... snip ...
  programs.librewolf = {
    enable = true;
    settings = {
      webgl.disabled = false;
      privacy.clearOnShutdown = {
        history = false;
        downloads = false;
        cookies = false;
      };
      network = {
        cookie.lifetimePolicy = 0;
        trr = {
          mode = 3;
          uri = "https://dns.mullvad.net/dns-query";
          default_provider_uri = "https://dns10.quad9.net/dns-query";
          strict_native_fallback = false;
          retry_on_recoverable_errors = true;
          disable-heuristics = true;
          allow-rfc1918 = true;
        };
      };
    };
  };
  # ... snip ...
```

Here's the key though, that attrset has to be converted back to the string paths we saw earlier as that's what the Home Manager module requires for the settings.

# Writing a function to convert an attrset to a flattened bunch of string paths

Here's what I cooked up (probably still pink and raw in the center, eat at your own risk) and I'll show it mostly in its full, hideous, glory:

```nix
{ lib, ... }:
let
  # Converts an attrset to the string representation of its paths
  #   {
  #     hello = { world = true; };
  #     goodbye = { moon = "bye"; }
  #   }
  #     Becomes
  #   {
  #     "hello.world" = true;
  #     "goodbye.moon" = "bye";
  #   }
  #     Works for arbitrarily nested attrsets
  attrsToStringPath =
    attrs:
    let
      _attrsToStringPath =
        _parent:
        let
          parent = if isNull _parent then "" else "${_parent}.";
        in
        attrs:
        lib.attrsets.foldlAttrs (
          acc: _name:
          let
            name = "${parent}${_name}";
          in
          value:
          acc // (if builtins.isAttrs value then _attrsToStringPath name value else { "${name}" = value; })
        ) { } attrs;
    in
    _attrsToStringPath null attrs;
in
{
  programs.librewolf = {
    enable = true;
    settings = attrsToStringPath { # <========= THIS LINE IS IMPORTANT, this is where the function is used!
      webgl.disabled = false;
      privacy.clearOnShutdown = {
        history = false;
        downloads = false;
        cookies = false;
      };
      network = {
        cookie.lifetimePolicy = 0;
        trr = {
          mode = 3;
          uri = "https://dns.mullvad.net/dns-query";
          default_provider_uri = "https://dns10.quad9.net/dns-query";
          strict_native_fallback = false;
          retry_on_recoverable_errors = true;
          disable-heuristics = true;
          allow-rfc1918 = true;
        };
      };
    };
  };
}
```

By abusing recursion we slowly accumulate and build our full string paths together for each value. Now I have some small piece of mind that I can go nuts with my attrset fun in my config.

Maybe someone out there will find this useful or look at this and go "they know that's built into `nixpkgs.lib` right?" To that person I say this: I keep a cookie jar of lead chips around to snack on.
