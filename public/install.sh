#!/usr/bin/env bash
set -euo pipefail

minimum_claude_version="2.1.238"
marketplace_url="https://api.trymartin.dev/marketplace.json"
settings="$HOME/.claude/settings.json"
settings_backup="$settings.before-martin"
martin_alias="alias martin='claude --agent martin'"

error() {
  echo "error: $*" >&2
  exit 1
}

require_api_key() {
  [[ -n "${MARTIN_API_KEY:-}" ]] ||
    error "MARTIN_API_KEY is not set. Your key is in the email from support@trymartin.dev."
}

require_claude_code() {
  command -v claude >/dev/null ||
    error "Claude Code is required to install martin. Get it at https://claude.com/claude-code"

  local installed_version oldest_version
  installed_version="$(claude --version | awk '{print $1}')"
  oldest_version="$(printf '%s\n' "$minimum_claude_version" "$installed_version" | sort -V | head -n 1)"
  [[ "$oldest_version" == "$minimum_claude_version" ]] ||
    error "martin needs Claude Code $minimum_claude_version or newer; you have $installed_version. Run \`claude update\`."
}

require_json_parser() {
  perl -MJSON::PP -e 1 2>/dev/null ||
    error "perl with JSON::PP is required to install martin"
}

require_accepted_api_key() {
  curl -fs -o /dev/null -H "Authorization: Bearer $MARTIN_API_KEY" "$marketplace_url" ||
    error "that API key was not accepted. Recopy it from the email from support@trymartin.dev."
}

back_up_settings() {
  [[ -f "$settings" && ! -e "$settings_backup" ]] || return 0
  cp "$settings" "$settings_backup"
  echo "Backed up ~/.claude/settings.json to ~/.claude/settings.json.before-martin"
}

declare_marketplace() {
  mkdir -p "$(dirname "$settings")"
  local merged_settings
  merged_settings="$(mktemp)"
  perl -MJSON::PP -e '
    my ($settings_path, $marketplace_url) = @ARGV;
    my $json = JSON::PP->new->utf8->pretty->canonical;
    my $settings = {};
    if (open my $file, "<", $settings_path) {
      local $/;
      $settings = $json->decode(<$file>);
    }
    $settings->{extraKnownMarketplaces}{martin} = {
      source => {
        source  => "url",
        url     => $marketplace_url,
        headers => { Authorization => "Bearer $ENV{MARTIN_API_KEY}" },
      },
    };
    print $json->encode($settings);
  ' "$settings" "$marketplace_url" >"$merged_settings"
  mv "$merged_settings" "$settings"
}

register_marketplace() {
  claude -p "/cost" </dev/null >/dev/null
}

install_plugin() {
  claude plugin install martin@martin </dev/null >/dev/null
}

add_alias() {
  local profile
  case "$(basename "${SHELL:-}")" in
    zsh) profile="$HOME/.zshrc" ;;
    bash) profile="$HOME/.bashrc" ;;
    *) return 0 ;;
  esac
  grep -qF "alias martin=" "$profile" 2>/dev/null || echo "$martin_alias" >>"$profile"
}

main() {
  require_api_key
  require_claude_code
  require_json_parser
  require_accepted_api_key

  echo "Installing martin plugin..."
  back_up_settings
  declare_marketplace
  register_marketplace
  install_plugin
  add_alias

  cat <<'DONE'
Done! You are now ready to use Martin in Claude Code:

claude --agent martin "Introduce yourself and describe your capabilities"
DONE
}

main
