package agentgen

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type SkillStatus struct {
	Name   string
	Status string
}

type SkillHelp struct {
	Name string
	Path string
	Text string
}

func profileSkillsDir(dirname string) string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join("~", dirname, "skills")
	}
	return filepath.Join(home, dirname, "skills")
}

func CodexSkillsDir() string {
	return profileSkillsDir(".codex")
}

func ClaudeSkillsDir() string {
	return profileSkillsDir(".claude")
}

func OpenClawSkillsDir() string {
	return profileSkillsDir(".openclaw")
}

func ApprovedCodexSkills() []string {
	return []string{"agent-code-server", "agent-webpage", "cf-tunnel", "cping", "globalApiToken", "google", "ssh", "tm"}
}

func canonicalCodexSkillName(name string) string {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "agent-code-server", "agentcodeserver", "agent_code_server", "code-server", "codeserver":
		return "agent-code-server"
	case "agent-webpage", "agentwebpage", "agent_webpage", "webpage", "agent-page-ping":
		return "agent-webpage"
	case "cf-tunnel":
		return "cf-tunnel"
	case "cping":
		return "cping"
	case "globalapitoken", "global-api-token":
		return "globalApiToken"
	case "google":
		return "google"
	case "ssh":
		return "ssh"
	case "tm":
		return "tm"
	default:
		return ""
	}
}

func Generate(root, profileName, targetRoot, commandBinDir string) error {
	_, err := Sync(root, profileName, targetRoot, commandBinDir)
	return err
}

func List(profileName, targetRoot string) ([]SkillStatus, error) {
	profileName = normalizeProfile(profileName)
	targetRoot = defaultProfileTarget(profileName, targetRoot)
	switch profileName {
	case "codex", "claude", "openclaw":
		return listCodex(targetRoot)
	default:
		return nil, fmt.Errorf("only codex, claude, and openclaw skill generation are enabled right now")
	}
}

func Help(profileName, targetRoot, skillName string) (SkillHelp, error) {
	profileName = normalizeProfile(profileName)
	targetRoot = defaultProfileTarget(profileName, targetRoot)
	switch profileName {
	case "codex", "claude", "openclaw":
		return helpCodex(targetRoot, skillName)
	default:
		return SkillHelp{}, fmt.Errorf("only codex, claude, and openclaw skill generation are enabled right now")
	}
}

func Tools(profileName, targetRoot, skillName string) (SkillHelp, error) {
	profileName = normalizeProfile(profileName)
	targetRoot = defaultProfileTarget(profileName, targetRoot)
	switch profileName {
	case "codex", "claude", "openclaw":
		return toolsCodex(targetRoot, skillName)
	default:
		return SkillHelp{}, fmt.Errorf("only codex, claude, and openclaw skill generation are enabled right now")
	}
}

func Install(root, profileName, targetRoot, commandBinDir string, skillNames []string) ([]string, error) {
	profileName = normalizeProfile(profileName)
	targetRoot = defaultProfileTarget(profileName, targetRoot)
	switch profileName {
	case "codex", "claude", "openclaw":
		return installCodex(targetRoot, commandBinDir, skillNames)
	default:
		return nil, fmt.Errorf("only codex, claude, and openclaw skill generation are enabled right now")
	}
}

func Update(root, profileName, targetRoot, commandBinDir string, skillNames []string) ([]string, error) {
	return Install(root, profileName, targetRoot, commandBinDir, skillNames)
}

func Remove(profileName, targetRoot string, skillNames []string) ([]string, error) {
	profileName = normalizeProfile(profileName)
	targetRoot = defaultProfileTarget(profileName, targetRoot)
	switch profileName {
	case "codex", "claude", "openclaw":
		return removeCodex(targetRoot, skillNames)
	default:
		return nil, fmt.Errorf("only codex, claude, and openclaw skill generation are enabled right now")
	}
}

func Sync(root, profileName, targetRoot, commandBinDir string) ([]string, error) {
	profileName = normalizeProfile(profileName)
	targetRoot = defaultProfileTarget(profileName, targetRoot)
	switch profileName {
	case "codex", "claude", "openclaw":
		return installCodex(targetRoot, commandBinDir, ApprovedCodexSkills())
	default:
		return nil, fmt.Errorf("only codex, claude, and openclaw skill generation are enabled right now")
	}
}

func normalizeProfile(profileName string) string {
	return strings.ToLower(strings.TrimSpace(profileName))
}

func defaultProfileTarget(profileName, targetRoot string) string {
	if strings.TrimSpace(targetRoot) != "" {
		return targetRoot
	}
	switch normalizeProfile(profileName) {
	case "codex":
		return CodexSkillsDir()
	case "claude":
		return ClaudeSkillsDir()
	case "openclaw":
		return OpenClawSkillsDir()
	default:
		return targetRoot
	}
}

func listCodex(targetRoot string) ([]SkillStatus, error) {
	approved := ApprovedCodexSkills()
	approvedSet := make(map[string]struct{}, len(approved))
	statuses := make([]SkillStatus, 0, len(approved))
	for _, skill := range approved {
		approvedSet[skill] = struct{}{}
		status := "missing"
		if dirExists(filepath.Join(targetRoot, skill)) {
			status = "installed"
		}
		statuses = append(statuses, SkillStatus{Name: skill, Status: status})
	}

	entries, err := os.ReadDir(targetRoot)
	if err != nil {
		if os.IsNotExist(err) {
			return statuses, nil
		}
		return nil, err
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasPrefix(name, ".") {
			continue
		}
		if _, ok := approvedSet[name]; ok {
			continue
		}
		statuses = append(statuses, SkillStatus{Name: name, Status: "external"})
	}
	sort.Slice(statuses, func(i, j int) bool {
		return statuses[i].Name < statuses[j].Name
	})
	return statuses, nil
}

func installCodex(targetRoot, commandBinDir string, skillNames []string) ([]string, error) {
	skills, err := resolveCodexSkills(skillNames)
	if err != nil {
		return nil, err
	}
	if commandBinDir == "" {
		return nil, fmt.Errorf("command bin dir is required")
	}
	installed := make([]string, 0, len(skills))
	for _, skill := range skills {
		if err := generateCodexSkill(targetRoot, commandBinDir, skill); err != nil {
			return nil, err
		}
		installed = append(installed, skill)
	}
	return installed, nil
}

func removeCodex(targetRoot string, skillNames []string) ([]string, error) {
	skills, err := resolveCodexSkills(skillNames)
	if err != nil {
		return nil, err
	}
	removed := make([]string, 0, len(skills))
	for _, skill := range skills {
		if err := os.RemoveAll(filepath.Join(targetRoot, skill)); err != nil {
			return nil, err
		}
		removed = append(removed, skill)
	}
	return removed, nil
}

func resolveCodexSkills(skillNames []string) ([]string, error) {
	approved := ApprovedCodexSkills()
	approvedSet := make(map[string]struct{}, len(approved))
	for _, skill := range approved {
		approvedSet[strings.ToLower(skill)] = struct{}{}
	}

	normalizedNames := make([]string, 0, len(skillNames))
	for _, name := range skillNames {
		normalized := strings.ToLower(strings.TrimSpace(name))
		if normalized == "" {
			continue
		}
		normalizedNames = append(normalizedNames, normalized)
	}

	seen := map[string]struct{}{}
	var resolved []string
	for _, normalized := range normalizedNames {
		if normalized == "all" {
			if len(normalizedNames) > 1 {
				return nil, fmt.Errorf("all cannot be mixed with explicit skill names")
			}
			return append([]string(nil), approved...), nil
		}
		canonical := canonicalCodexSkillName(normalized)
		if canonical == "" {
			return nil, fmt.Errorf("skill %q is not approved for codex; approved: %s", normalized, strings.Join(approved, ", "))
		}
		if _, ok := approvedSet[strings.ToLower(canonical)]; !ok {
			return nil, fmt.Errorf("skill %q is not approved for codex; approved: %s", normalized, strings.Join(approved, ", "))
		}
		if _, ok := seen[canonical]; ok {
			continue
		}
		seen[canonical] = struct{}{}
		resolved = append(resolved, canonical)
	}
	if len(resolved) == 0 {
		return nil, fmt.Errorf("at least one approved skill is required")
	}
	sort.Strings(resolved)
	return resolved, nil
}

func generateCodexSkill(targetRoot, commandBinDir, skill string) error {
	switch skill {
	case "agent-code-server":
		return generateCodexAgentCodeServer(targetRoot, commandBinDir)
	case "agent-webpage":
		return generateCodexAgentWebpage(targetRoot, commandBinDir)
	case "cf-tunnel":
		return generateCodexCFTunnel(targetRoot, commandBinDir)
	case "cping":
		return generateCodexCPing(targetRoot, commandBinDir)
	case "globalApiToken":
		return generateCodexGlobalAPIToken(targetRoot, commandBinDir)
	case "google":
		return generateCodexGoogle(targetRoot, commandBinDir)
	case "ssh":
		return generateCodexSSH(targetRoot, commandBinDir)
	case "tm":
		return generateCodexTM(targetRoot, commandBinDir)
	default:
		return fmt.Errorf("skill %q is not implemented", skill)
	}
}

func generateCodexCFTunnel(targetRoot, commandBinDir string) error {
	cfDir := filepath.Join(targetRoot, "cf-tunnel")
	refsDir := filepath.Join(cfDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(cfDir, "SKILL.md"), renderCFTunnelSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderCFTunnelHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderCFTunnelCommands()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexCPing(targetRoot, commandBinDir string) error {
	skillDir := filepath.Join(targetRoot, "cping")
	refsDir := filepath.Join(skillDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(skillDir, "SKILL.md"), renderCPingSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderCPingHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderCPingCommands()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexGoogle(targetRoot, commandBinDir string) error {
	googleDir := filepath.Join(targetRoot, "google")
	refsDir := filepath.Join(googleDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(googleDir, "SKILL.md"), renderGoogleSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderGoogleHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderGoogleCommands()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexGlobalAPIToken(targetRoot, commandBinDir string) error {
	skillDir := filepath.Join(targetRoot, "globalApiToken")
	refsDir := filepath.Join(skillDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(skillDir, "SKILL.md"), renderGlobalAPITokenSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderGlobalAPITokenHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderGlobalAPITokenCommands()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexAgentCodeServer(targetRoot, commandBinDir string) error {
	skillDir := filepath.Join(targetRoot, "agent-code-server")
	refsDir := filepath.Join(skillDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(skillDir, "SKILL.md"), renderAgentCodeServerSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderAgentCodeServerHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderAgentCodeServerTools()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexAgentWebpage(targetRoot, commandBinDir string) error {
	skillDir := filepath.Join(targetRoot, "agent-webpage")
	refsDir := filepath.Join(skillDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(skillDir, "SKILL.md"), renderAgentWebpageSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderAgentWebpageHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderAgentWebpageTools()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexTM(targetRoot, commandBinDir string) error {
	skillDir := filepath.Join(targetRoot, "tm")
	refsDir := filepath.Join(skillDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(skillDir, "SKILL.md"), renderTMSkill(commandBinDir)); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderTMHelp(commandBinDir)); err != nil {
		return err
	}
	tools := renderTMCommands(commandBinDir)
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func generateCodexSSH(targetRoot, commandBinDir string) error {
	skillDir := filepath.Join(targetRoot, "ssh")
	refsDir := filepath.Join(skillDir, "references")
	if err := os.MkdirAll(refsDir, 0o755); err != nil {
		return err
	}
	if err := writeText(filepath.Join(skillDir, "SKILL.md"), renderSSHSkill()); err != nil {
		return err
	}
	if err := writeText(filepath.Join(refsDir, "help.md"), renderSSHHelp()); err != nil {
		return err
	}
	tools := renderSSHCommands()
	if err := writeText(filepath.Join(refsDir, "tools.md"), tools); err != nil {
		return err
	}
	return writeText(filepath.Join(refsDir, "commands.md"), tools)
}

func helpCodex(targetRoot, skillName string) (SkillHelp, error) {
	return readCodexReference(targetRoot, skillName, "help.md")
}

func toolsCodex(targetRoot, skillName string) (SkillHelp, error) {
	return readCodexReference(targetRoot, skillName, "tools.md", "commands.md")
}

func readCodexReference(targetRoot, skillName string, filenames ...string) (SkillHelp, error) {
	skills, err := resolveCodexSkills([]string{skillName})
	if err != nil {
		return SkillHelp{}, err
	}
	skill := skills[0]
	var paths []string
	for _, filename := range filenames {
		path := filepath.Join(targetRoot, skill, "references", filename)
		paths = append(paths, path)
		data, err := os.ReadFile(path)
		if err == nil {
			return SkillHelp{
				Name: skill,
				Path: path,
				Text: string(data),
			}, nil
		}
		if !os.IsNotExist(err) {
			return SkillHelp{}, err
		}
	}
	return SkillHelp{}, fmt.Errorf("skill %q reference is missing at %s; install or update the skill first", skill, strings.Join(paths, ", "))
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}

func writeText(path, text string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(text), 0o644)
}

func renderGoogleSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: google
description: Use the local google CLI wrapper from %s for Gmail, Sheets, Drive, and Calendar on this host.
---

# Google

This skill covers the local `+"`google`"+` wrapper installed from `+"`"+`%s`+"`"+`.

Use these commands directly from `+"`PATH`"+`. They read real credentials from `+"`~/global.json`"+`.

## Scope

Use this skill when the task involves:

- Gmail inbox listing, reading, sending, or verification-code watching
- Google Sheets read/write/append/create
- Google Drive list/upload/download/quota work
- Google Calendar list/events/create

## Rules

1. Prefer the local wrapper commands first.
2. For unfamiliar subcommands, run `+"`google help`"+` or `+"`google <service> help`"+`.
3. Use the real token configured on the host. Do not mock Google responses.
4. Report the concrete command result back to the user.

## Help

Read [help.md](./references/help.md) first for quick usage, rules, and examples.

## Tools

Read [tools.md](./references/tools.md) for the full tool and command shapes.
`, commandBinDir, commandBinDir)
}

func renderGlobalAPITokenSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: globalApiToken
description: Use the local globalApiToken wrapper from %s to show or refresh ~/global.json api_token on this host.
---

# Global API Token

This skill covers the local `+"`globalApiToken`"+` wrapper installed from `+"`"+`%s`+"`"+`.

Use this command directly from `+"`PATH`"+`. It reads and updates the real `+"`~/global.json`"+` file on this host.

## Scope

Use this skill when the task involves:

- showing the current `+"`api_token`"+` from `+"`~/global.json`"+`
- rotating or refreshing `+"`~/global.json api_token`"+`

## Rules

1. Prefer the local `+"`globalApiToken`"+` command first.
2. Operate on the real `+"`~/global.json`"+`; do not fabricate token values.
3. Only refresh the token when the user explicitly asks to rotate or refresh it.
4. Report the resulting token value back to the user when requested.

## Help

Read [help.md](./references/help.md) first for quick usage.

## Tools

Read [tools.md](./references/tools.md) for the full tool and command shapes.
`, commandBinDir, commandBinDir)
}

func renderGoogleHelp(commandBinDir string) string {
	return fmt.Sprintf(`# Google Help

## Command

- binary root: %s
- primary command: `+"`google`"+`

## Quick Start

- inspect usage: `+"`google help`"+`
- inspect gmail shortcuts: `+"`google gmail help`"+`
- list recent mail: `+"`google gmail list 5`"+`
- list spreadsheets: `+"`google sheets list`"+`
- list drive files: `+"`google drive list`"+`
- list calendars: `+"`google calendar list`"+`

## Rules

- use the real credentials in `+"`~/global.json`"+`
- do not mock Google responses
- report exact command output or concrete results back to the user

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderGlobalAPITokenHelp(commandBinDir string) string {
	return fmt.Sprintf(`# Global API Token Help

## Command

- binary root: %s
- primary command: `+"`globalApiToken`"+`

## Quick Start

- show current token: `+"`globalApiToken show`"+`
- refresh token: `+"`globalApiToken refresh`"+`

## Rules

- read the real token from `+"`~/global.json`"+`
- refresh updates `+"`~/global.json api_token`"+` in place
- do not rotate the token unless the user explicitly asks

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderCFTunnelSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: cf-tunnel
description: Use the local cf-tunnel wrapper from %s to manage Cloudflare Tunnel routes and DNS on this host.
---

# Cf Tunnel

This skill covers the local `+"`cf-tunnel`"+` wrapper installed from `+"`"+`%s`+"`"+`.

Use this command directly from `+"`PATH`"+`. It reads real Cloudflare credentials from `+"`~/global.json`"+`.

## Scope

Use this skill when the task involves:

- listing current Cloudflare tunnel routes for this host
- adding one or more `+"`g-<port>.<domain>`"+` tunnel hostnames that map to local ports
- deleting one or more existing tunnel routes and DNS records
- working against `+"`prod`"+` or `+"`dev`"+` Cloudflare config via `+"`CF_ENV`"+`

## Rules

1. Prefer the local `+"`cf-tunnel`"+` command first.
2. Use the real Cloudflare config from `+"`~/global.json`"+`. Do not mock responses.
3. `+"`cf-tunnel`"+` manages routes and DNS only. Do not kill or manage the `+"`cloudflared`"+` process unless the user explicitly asks.
4. Report the exact hostname and port mapping results back to the user.

## Help

Read [help.md](./references/help.md) first for quick usage, rules, and examples.

## Tools

Read [tools.md](./references/tools.md) for the full tool and command shapes.
`, commandBinDir, commandBinDir)
}

func renderCPingSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: cping
description: Use the local cping wrapper from %s to check network latency to a domain or IP from this host, with emphasis on China-side reachability.
---

# cping

This skill covers the local `+"`cping`"+` wrapper installed from `+"`%s`"+`.

Use it when the user asks for latency checks, China-side ping quality, or quick network verification for a hostname or IP.

## Scope

Use this skill for:

- checking latency for a domain or IP
- comparing rough China-side network quality from this host
- reporting target resolution from hostname to IP
- verifying whether a public endpoint looks reachable and fast

## Rules

1. Prefer the local `+"`cping`"+` command first.
2. Report the actual target used and the resolved IP when shown.
3. Treat the output as observational network data; do not over-claim the cause of latency.
4. If the user needs protocol-specific debugging beyond `+"`cping`"+`, say so and switch to other tools only after this quick check.

## Help

Read [help.md](./references/help.md) first for quick usage.

## Tools

Read [tools.md](./references/tools.md) for the supported command shapes.
`, commandBinDir, commandBinDir)
}

func renderAgentWebpageSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: agent-webpage
description: Use the local agent-webpage wrapper from %s to talk to the live webpage client for an agent on this host.
---

# Agent Webpage

This skill covers the local `+"`agent-webpage`"+` wrapper installed from `+"`"+`%s`+"`"+`.

Use this command directly from `+"`PATH`"+`. It talks to the real webpage client through the live chat websocket and returns the real webpage response.

Legacy aliases still exist for compatibility:

- `+"`webpage`"+`
- `+"`webpage-ping`"+`
- `+"`agent-page-ping`"+`
- `+"`ipc-ping`"+`

## Scope

Use this skill when the task involves:

- checking whether an agent's webpage client is connected
- running JS in the live webpage client
- sending webpage events and waiting for the response
- checking connected webpage clients for an agent

## Rules

1. Prefer the local `+"`agent-webpage`"+` command first.
2. Target a specific connected webpage by `+"`client_id`"+`.
3. If no `+"`client_id`"+` is provided, only auto-target when the current agent has exactly one connected client.
4. For response-oriented calls, wait for and report the actual webpage response instead of only reporting that the event was sent.
5. Use `+"`agent-webpage help`"+` and `+"`agent-webpage tools`"+` before guessing subcommand shapes.

## Help

Read [help.md](./references/help.md) first for quick usage, rules, and examples.

## Tools

Read [tools.md](./references/tools.md) for the supported tools, response types, and command shapes.
`, commandBinDir, commandBinDir)
}

func renderTMSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: tm
description: Operate tmux panes and windows on this host with the local tm wrapper from %s. Prefer tm for quick local pane work and cicy-code for node-aware tmux APIs.
---

# tm

This skill is for tmux-style pane and window operations in the CiCy environment.

Primary tools:

- `+"`tm`"+` for quick local pane operations
- `+"`cicy-code`"+` for tmux and pane APIs, especially when node-aware or API-level control is needed

Do not use `+"`fast-api`"+` for tmux work when `+"`tm`"+` or `+"`cicy-code`"+` covers it.

## Scope

Use this skill for:

- listing panes
- checking pane or window status
- capturing pane output
- sending text or keys to a pane
- creating or restarting panes
- clearing panes
- listing, selecting, renaming, creating, or deleting tmux windows
- doing the same on a selected `+"`cicy-code`"+` node via `+"`cicy-code -n <instance>`"+`

## Rules

1. Prefer `+"`tm`"+` for local convenience operations on this host.
2. Prefer `+"`cicy-code`"+` when the task is node-aware, API-oriented, or needs features beyond the thin `+"`tm`"+` wrapper.
3. Do not route tmux work through `+"`fast-api`"+` unless there is a specific reason `+"`tm`"+` and `+"`cicy-code`"+` cannot do it.
4. The primary pane is usually `+"`w-10001`"+`.
5. If targeting a node, use `+"`cicy-code -n <instance> ...`"+` and let the registry resolve the node.

## Help

Read [help.md](./references/help.md) first for quick usage.

## Tools

Read [tools.md](./references/tools.md) for the command map.
`, commandBinDir)
}

func renderSSHSkill() string {
	return `---
name: ssh
description: Use OpenSSH on this host. Trigger when the task mentions ssh, ~/.ssh/config, ssh config hosts, ssh aliases, remote login, jump hosts, or adding/listing/using SSH nodes from local config.
---

# ssh

This skill is for SSH access and local SSH config management on this host.

Use the real OpenSSH client and treat ` + "`~/.ssh/config`" + ` as the primary source of named nodes.

## Scope

Use this skill for:

- explaining how SSH on this host is configured
- reading ` + "`~/.ssh/config`" + ` first when the user asks about SSH nodes
- listing configured ` + "`Host`" + ` entries
- adding or updating SSH node entries in ` + "`~/.ssh/config`" + `
- using configured nodes via ` + "`ssh <host>`" + `
- running one-off remote commands via ` + "`ssh <host> '<cmd>'`" + `
- checking jump-host settings, ports, users, and identity files

## Rules

1. Read ` + "`~/.ssh/config`" + ` before guessing host aliases.
2. Prefer existing ` + "`Host`" + ` aliases from config over raw hostnames when both exist.
3. Never overwrite ` + "`~/.ssh/config`" + `; preserve unrelated entries and edit surgically.
4. If the config uses ` + "`Include`" + `, inspect ` + "`~/.ssh/config`" + ` first, then follow includes only when needed.
5. When adding a node, keep the block minimal unless the user asks for extra options.
6. For actual connections, use the real ` + "`ssh`" + ` command directly. Do not invent wrapper commands.
7. If a command may prompt for a password, host-key trust, or MFA, note that interactive input may be required.

## Help

Read [help.md](./references/help.md) first for quick usage.

## Tools

Read [tools.md](./references/tools.md) for the common command shapes.
`
}

func renderCFTunnelHelp(commandBinDir string) string {
	return fmt.Sprintf(`# Cf Tunnel Help

## Command

- binary root: %s
- primary command: `+"`cf-tunnel`"+`

## Quick Start

- inspect routes: `+"`cf-tunnel list`"+`
- add one route: `+"`cf-tunnel add 8101`"+`
- add multiple routes: `+"`cf-tunnel add 5174 8010 13000`"+`
- delete a route: `+"`cf-tunnel del 8101`"+`
- use dev config: `+"`CF_ENV=dev cf-tunnel list`"+`

## Rules

- use the real Cloudflare config in `+"`~/global.json`"+`
- do not mock Cloudflare responses
- `+"`cf-tunnel`"+` manages route and DNS state only; it does not manage the `+"`cloudflared`"+` process
- report exact hostname and port mappings back to the user

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderCPingHelp(commandBinDir string) string {
	return fmt.Sprintf(`# cping Help

## Command

- binary root: %s
- primary command: `+"`cping`"+`

## Quick Start

- ping a domain: `+"`cping tn.cicy-ai.com`"+`
- ping an IP: `+"`cping 35.241.97.128`"+`
- compare a public hostname: `+"`cping baidu.com`"+`

## Rules

- use the real `+"`cping`"+` wrapper output, not a mocked summary
- report the target and resolved IP when shown
- treat this as a quick latency signal, not a full root-cause analysis
- if the user needs deeper diagnosis, use `+"`cping`"+` first and then move to other network tools

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderAgentCodeServerSkill(commandBinDir string) string {
	return fmt.Sprintf(`---
name: agent-code-server
description: Use the local agent-code-server wrapper from %s to open a file in the current page-bound code-server on this host.
---

# Agent Code Server

This skill covers the local `+"`agent-code-server`"+` wrapper installed from `+"`"+`%s`+"`"+`.

Use this command directly from `+"`PATH`"+`. It sends the standard `+"`code.open_file`"+` event to the real page client.

## Scope

Use this skill when the task involves:

- opening a file in the current page's code-server
- targeting a specific connected page by `+"`page_client_id`"+`
- checking available page clients before opening a file

## Rules

1. Prefer the local `+"`agent-code-server`"+` command first.
2. Target a specific page by `+"`page_client_id`"+`.
3. If no `+"`page_client_id`"+` is provided, only auto-target when the current agent has exactly one connected page client.
4. `+"`ping`"+` checks whether the matching `+"`:code-ext`"+` client is online.
5. The standard open action accepts plain paths, `+"`file://`"+` paths, and optional line/column suffixes.
6. Use `+"`agent-code-server help`"+` and `+"`agent-code-server tools`"+` before guessing command shapes.

## Help

Read [help.md](./references/help.md) first for quick usage and examples.

## Tools

Read [tools.md](./references/tools.md) for the supported commands.
`, commandBinDir, commandBinDir)
}

func renderAgentCodeServerHelp(commandBinDir string) string {
	return fmt.Sprintf(`# Agent Code Server Help

## Command

- binary root: %s
- primary command: `+"`agent-code-server`"+`

## Quick Start

- inspect usage: `+"`agent-code-server help`"+`
- inspect tool map: `+"`agent-code-server tools`"+`
- inspect current page clients: `+"`agent-code-server list`"+`
- check whether code-server is connected for a page: `+"`agent-code-server ping web-abc123`"+`
- open a file in the current page-bound code-server: `+"`agent-code-server open ~/.bashrc:12 web-abc123`"+`

## Rules

- use the real live page client, not mocks
- identify the target by `+"`page_client_id`"+`
- `+"`ping`"+` checks whether `+"`page_client_id:code-ext`"+` is connected
- the standard event is `+"`code.open_file`"+`
- the open path may include `+"`:line`"+`, `+"`:line:column`"+`, or range suffixes
- if you need the exact command shape, read [tools.md](./tools.md)

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderAgentWebpageHelp(commandBinDir string) string {
	return fmt.Sprintf(`# Agent Webpage Help

## Command

- binary root: %s
- primary command: `+"`agent-webpage`"+`

## Quick Start

- inspect usage: `+"`agent-webpage help`"+`
- inspect tool map: `+"`agent-webpage tools`"+`
- ping the current agent's only connected webpage client: `+"`agent-webpage ping`"+`
- ping a specific client: `+"`agent-webpage ping web-abc123`"+`
- run JS in a specific live webpage client: `+"`agent-webpage exec-js 'window.location.href' web-abc123`"+`
- inspect connected clients: `+"`agent-webpage clients`"+`

## Rules

- use the real live webpage client, not mocks
- identify the target by `+"`client_id`"+`; the tool resolves the owning `+"`agent_id`"+`
- for response-oriented calls, report the actual returned payload
- if you need the exact subcommand shape, read [tools.md](./tools.md)

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderTMHelp(commandBinDir string) string {
	return fmt.Sprintf(`# tm Help

## Command

- binary root: %s
- primary command: `+"`tm`"+`

## Quick Start

- list panes: `+"`tm ls`"+`
- capture pane output: `+"`tm capture w-10001`"+`
- send a message: `+"`tm msg w-10001 \"hello\"`"+`
- send a key: `+"`tm send-keys w-10001 Enter`"+`
- inspect tmux windows: `+"`tm windows`"+`

## Multi-Node

- use the configured default target: `+"`tm ls`"+`
- select a configured node: `+"`tm --node dev ls`"+`
- select a configured node by env: `+"`TM_NODE=dev tm ls`"+`
- bypass config and hit a specific API directly: `+"`TM_API_BASE=http://127.0.0.1:8021 tm ls`"+`

How to configure and use multi-node:

- create `+"`~/Private/tm.json`"+`
- set top-level `+"`default`"+` to the node you want `+"`tm ls`"+` to use
- define each node under `+"`nodes.<name>`"+`
- use `+"`tm --node <name> ...`"+` when you want a non-default node

Recommended `+"`~/Private/tm.json`"+` shape:

    {
      "default": "default",
      "nodes": {
        "default": {"api": "http://127.0.0.1:8008", "api_token": "<copy from ~/global.json api_token>"},
        "dev": {"api": "http://127.0.0.1:8021", "api_token": "<copy from ~/global.json api_token>"}
      }
    }

Resolution order:

- `+"`TM_API_BASE`"+` or `+"`API_BASE`"+`
- `+"`TM_NODE`"+` or `+"`--node`"+`, then `+"`~/Private/tm.json nodes[<name>]`"+`
- `+"`~/Private/tm.json default`"+` -> `+"`nodes[<default>]`"+`
- `+"`~/Private/tm.json api|api_base|url`"+`
- local fallback `+"`http://127.0.0.1:${TM_API_PORT|API_PORT|8008}`"+`

Token rules:

- `+"`TM_TOKEN`"+` overrides everything
- otherwise `+"`tm.nodes.<name>.api_token`"+` is used
- if `+"`~/Private/tm.json`"+` is missing, `+"`tm`"+` uses an in-memory default:
  - `+"`default = default`"+`
  - `+"`nodes.default.api = http://127.0.0.1:8008`"+`
  - `+"`nodes.default.api_token = ~/global.json api_token`"+`

## Rules

- prefer `+"`tm`"+` for quick local pane work
- prefer `+"`cicy-code`"+` for node-aware tmux work such as `+"`cicy-code -n node-a panes`"+`
- avoid `+"`fast-api`"+` for tmux work when `+"`tm`"+` or `+"`cicy-code`"+` covers it
- the common primary pane is `+"`w-10001`"+`

## More

- tool map: [tools.md](./tools.md)
`, commandBinDir)
}

func renderSSHHelp() string {
	return `# ssh Help

## Primary Files

- main config: ` + "`~/.ssh/config`" + `
- optional includes: inspect ` + "`Include`" + ` lines only when needed

## Quick Start

- list configured aliases from ` + "`~/.ssh/config`" + `
- inspect one alias block before using it
- connect with ` + "`ssh <alias>`" + `
- run a remote command with ` + "`ssh <alias> '<command>'`" + `

## Add Node Workflow

Preferred minimal block:

` + "```sshconfig" + `
Host my-node
  HostName 1.2.3.4
  User root
  Port 22
` + "```" + `

Only add ` + "`IdentityFile`" + `, ` + "`ProxyJump`" + `, or other advanced fields when the user asks or the existing config style clearly expects them.

## Rules

- always read ` + "`~/.ssh/config`" + ` before guessing aliases
- preserve unrelated config when editing
- prefer existing aliases from config over raw hostnames
- after editing, re-read the affected block and report the alias used
`
}

func renderGoogleCommands() string {
	return `# Google Commands

## Gmail

- ` + "`google gmail list [count]`" + `
- ` + "`google gmail read <n>`" + `
- ` + "`google gmail read-all`" + `
- ` + "`google gmail send <to> <subject> [body]`" + `
- ` + "`google gmail watch [keyword]`" + `

## Sheets

- ` + "`google sheets list`" + `
- ` + "`google sheets read <id> <range>`" + `
- ` + "`google sheets write <id> <range> <json>`" + `
- ` + "`google sheets append <id> <range> <json>`" + `
- ` + "`google sheets create <title>`" + `

## Drive

- ` + "`google drive list [query] [pageSize]`" + `
- ` + "`google drive upload <name> <content>`" + `
- ` + "`google drive upload-dir <path> [--exclude patterns]`" + `
- ` + "`google drive download <id>`" + `
- ` + "`google drive download-dir <id> <path>`" + `
- ` + "`google drive quota`" + `

## Calendar

- ` + "`google calendar list`" + `
- ` + "`google calendar events [calId] [max]`" + `
- ` + "`google calendar create <summary> <start> <end>`" + `
`
}

func renderCFTunnelCommands() string {
	return `# Cf Tunnel Commands

## Main

- ` + "`cf-tunnel list`" + `
- ` + "`cf-tunnel add <port> [port2 ...]`" + `
- ` + "`cf-tunnel del <port> [port2 ...]`" + `

## Environment

- default environment: ` + "`prod`" + `
- override environment: ` + "`CF_ENV=dev cf-tunnel list`" + `
- override environment: ` + "`CF_ENV=dev cf-tunnel add 5174 8010 13000`" + `

## Notes

- hostnames follow the pattern ` + "`g-<port>.<domain>`" + `
- the command reads Cloudflare config from ` + "`~/global.json`" + `
- it manages tunnel routes and DNS records, not the ` + "`cloudflared`" + ` process
`
}

func renderCPingCommands() string {
	return `# cping Commands

## Main

- ` + "`cping <domain_or_ip>`" + `

## Examples

- ` + "`cping tn.cicy-ai.com`" + `
- ` + "`cping 35.241.97.128`" + `
- ` + "`cping baidu.com`" + `

## Notes

- the command may resolve a hostname to an IP before reporting results
- the output is a quick latency snapshot from this host's perspective
- use it as a first-pass network check before deeper debugging
`
}

func renderGlobalAPITokenCommands() string {
	return `# Global API Token Commands

## Main

- ` + "`globalApiToken show`" + `
- ` + "`globalApiToken refresh`" + `

## Notes

- both commands operate on ` + "`~/global.json`" + `
- ` + "`show`" + ` prints the current ` + "`api_token`" + `
- ` + "`refresh`" + ` generates a new token and writes it back to ` + "`~/global.json`" + `
`
}

func renderTMCommands(commandBinDir string) string {
	return fmt.Sprintf(`# tm Command Reference

This skill uses two command families:

- `+"`tm`"+` from `+"`%s`"+`
- `+"`cicy-code`"+` from `+"`/home/w3c_offical/projects/cicy-code/skills/cicy-code`"+`

## Prefer tm

Use `+"`tm`"+` for quick local pane work:

- `+"`tm ls`"+`
- `+"`tm capture w-10001`"+`
- `+"`tm msg w-10001 \"hello\"`"+`
- `+"`tm send-keys w-10001 Enter`"+`
- `+"`tm create my-pane`"+`
- `+"`tm restart`"+`
- `+"`tm clear w-10001`"+`

Multi-node examples:

- `+"`tm ls`"+` -> use configured default target
- `+"`tm --node dev ls`"+` -> use `+"`tm.nodes.dev`"+`
- `+"`TM_NODE=dev tm capture w-10001`"+` -> target `+"`dev`"+`
- `+"`TM_API_BASE=http://127.0.0.1:8021 tm capture w-10001`"+` -> bypass node selection

Supported `+"`~/Private/tm.json`"+` keys:

- `+"`default`"+`
- `+"`api | api_base | url`"+`
- `+"`port`"+`
- `+"`nodes.<name>.api | api_base | url`"+`
- `+"`nodes.<name>.api_token`"+`
- `+"`nodes.<name>.token`"+` for legacy compatibility
- `+"`nodes.<name>.port`"+`

Observed `+"`tm`"+` commands:

- `+"`ls`"+`
- `+"`tree`"+`
- `+"`windows`"+`
- `+"`capture <pane>`"+`
- `+"`msg <pane> <text>`"+`
- `+"`msg_wait <pane> <text> [timeout]`"+`
- `+"`send-keys <pane> <keys>`"+`
- `+"`create <name>`"+`
- `+"`restart`"+`
- `+"`clear <pane>`"+`

## Prefer cicy-code for node-aware tmux work

Use `+"`cicy-code`"+` when the operation should go through the node registry or the cicy-code API surface:

- `+"`cicy-code panes`"+`
- `+"`cicy-code status w-10001`"+`
- `+"`cicy-code capture w-10001 200`"+`
- `+"`cicy-code send w-10001 \"hello\"`"+`
- `+"`cicy-code send-keys w-10001 Enter`"+`
- `+"`cicy-code windows`"+`
- `+"`cicy-code -n node-a panes`"+`

Observed tmux-related `+"`cicy-code`"+` commands:

- `+"`panes`"+`
- `+"`ls`"+`
- `+"`pane <pane_id>`"+`
- `+"`create-pane <json>`"+`
- `+"`update-pane <pane_id> <json>`"+`
- `+"`delete-pane <pane_id>`"+`
- `+"`restart-pane <pane_id>`"+`
- `+"`restart-all`"+`
- `+"`status [pane]`"+`
- `+"`send <pane_id> <text>`"+`
- `+"`send-keys <pane_id> <keys>`"+`
- `+"`send-wait <pane_id> <text> [timeout]`"+`
- `+"`capture <pane_id> [lines]`"+`
- `+"`clear <pane_id>`"+`
- `+"`tree`"+`
- `+"`windows [session]`"+`
- `+"`new-window <session> [name]`"+`
- `+"`rename-window <session> <index> <name>`"+`
- `+"`delete-window <session> <index>`"+`
- `+"`select-window <session> <index>`"+`

## Notes

- avoid `+"`fast-api`"+` for tmux work; use `+"`tm`"+` or `+"`cicy-code`"+`
- for remote node work, prefer `+"`cicy-code -n <instance> ...`"+`
- the common primary pane is `+"`w-10001`"+`
`, commandBinDir)
}

func renderSSHCommands() string {
	return `# ssh Command Reference

## Config Discovery

- read ` + "`~/.ssh/config`" + `
- parse ` + "`Host`" + ` entries to list known nodes
- inspect ` + "`HostName`" + `, ` + "`User`" + `, ` + "`Port`" + `, ` + "`IdentityFile`" + `, and ` + "`ProxyJump`" + `

## Common Commands

- ` + "`ssh <alias>`" + `
- ` + "`ssh <alias> '<command>'`" + `
- ` + "`ssh -J <jump-host> <alias>`" + ` when a one-off jump is needed
- ` + "`ssh -F ~/.ssh/config <alias>`" + ` when you need to force a specific config file

## Editing Rules

- append or edit host blocks surgically
- do not replace the whole config file
- keep new host blocks minimal unless the user asks for more options
`
}

func renderAgentCodeServerTools() string {
	return `# Agent Code Server Tools

- ping [page_client_id] -> checks whether the matching :code-ext client is connected
- list -> lists current page_client_id values and code-server connectivity
- clients -> legacy alias of list
- open <path> [page_client_id] -> direct push code.open_file to the page client; supports file:// and line/column suffixes
`
}

func renderAgentWebpageTools() string {
	return `# Agent Webpage Tools

## Main

- ` + "`agent-webpage help`" + ` -> print usage and guidance
- ` + "`agent-webpage tools`" + ` -> print this tool map
- ` + "`agent-webpage ping [client_id]`" + ` -> sends ` + "`webpage_ping`" + ` directly to ` + "`client_id`" + ` and waits for ` + "`webpage_pong`" + `
- ` + "`agent-webpage ipc-ping [client_id]`" + ` -> sends ` + "`ipc_ping`" + ` directly to ` + "`client_id`" + ` and waits for ` + "`ipc_pong`" + `
- ` + "`agent-webpage exec-js '<js>' [client_id]`" + ` -> sends ` + "`exec_js`" + ` directly to ` + "`client_id`" + ` and waits for ` + "`exec_js_result`" + `
- ` + "`agent-webpage send <type> <data_json> [client_id] [expect_type]`" + ` -> sends a custom event directly to ` + "`client_id`" + ` and waits for a matching websocket response when possible
- ` + "`agent-webpage clients`" + ` -> lists connected chat/webpage clients

## Aliases

- ` + "`webpage ...`" + ` -> legacy alias of ` + "`agent-webpage ...`" + `
- ` + "`webpage-ping [client_id]`" + ` -> legacy alias of ` + "`agent-webpage ping [client_id]`" + `
- ` + "`ipc-ping [client_id]`" + ` -> legacy alias of ` + "`agent-webpage ipc-ping [client_id]`" + `

## Response Rules

- ` + "`ping`" + ` waits for ` + "`webpage_pong`" + `
- ` + "`ipc-ping`" + ` waits for ` + "`ipc_pong`" + `
- ` + "`exec-js`" + ` waits for ` + "`exec_js_result`" + `
- ` + "`send`" + ` injects a ` + "`requestId`" + ` when the payload is a JSON object and waits for a response when it can match by ` + "`requestId`" + ` and/or ` + "`expect_type`" + `
- when a response is captured, print the real response JSON or result body back to the caller

## Notes

- the preferred target is ` + "`client_id`" + ` such as ` + "`web-abc123`" + `
- if ` + "`client_id`" + ` is omitted, the command only auto-targets when the current worker agent has exactly one connected client
- the command resolves the owning ` + "`agent_id`" + ` and then talks to the live chat websocket using ` + "`agent_id + client_id`" + `
`
}
