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

func CodexSkillsDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join("~", ".codex", "skills")
	}
	return filepath.Join(home, ".codex", "skills")
}

func ApprovedCodexSkills() []string {
	return []string{"cf-tunnel", "google"}
}

func Generate(root, profileName, targetRoot, commandBinDir string) error {
	_, err := Sync(root, profileName, targetRoot, commandBinDir)
	return err
}

func List(profileName, targetRoot string) ([]SkillStatus, error) {
	switch normalizeProfile(profileName) {
	case "codex":
		return listCodex(targetRoot)
	default:
		return nil, fmt.Errorf("only codex skill generation is enabled right now")
	}
}

func Help(profileName, targetRoot, skillName string) (SkillHelp, error) {
	switch normalizeProfile(profileName) {
	case "codex":
		return helpCodex(targetRoot, skillName)
	default:
		return SkillHelp{}, fmt.Errorf("only codex skill generation is enabled right now")
	}
}

func Install(root, profileName, targetRoot, commandBinDir string, skillNames []string) ([]string, error) {
	switch normalizeProfile(profileName) {
	case "codex":
		return installCodex(targetRoot, commandBinDir, skillNames)
	default:
		return nil, fmt.Errorf("only codex skill generation is enabled right now")
	}
}

func Update(root, profileName, targetRoot, commandBinDir string, skillNames []string) ([]string, error) {
	return Install(root, profileName, targetRoot, commandBinDir, skillNames)
}

func Remove(profileName, targetRoot string, skillNames []string) ([]string, error) {
	switch normalizeProfile(profileName) {
	case "codex":
		return removeCodex(targetRoot, skillNames)
	default:
		return nil, fmt.Errorf("only codex skill generation is enabled right now")
	}
}

func Sync(root, profileName, targetRoot, commandBinDir string) ([]string, error) {
	switch normalizeProfile(profileName) {
	case "codex":
		return installCodex(targetRoot, commandBinDir, ApprovedCodexSkills())
	default:
		return nil, fmt.Errorf("only codex skill generation is enabled right now")
	}
}

func normalizeProfile(profileName string) string {
	return strings.ToLower(strings.TrimSpace(profileName))
}

func listCodex(targetRoot string) ([]SkillStatus, error) {
	targetRoot = defaultCodexTarget(targetRoot)
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
	targetRoot = defaultCodexTarget(targetRoot)
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
	targetRoot = defaultCodexTarget(targetRoot)
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

func defaultCodexTarget(targetRoot string) string {
	if strings.TrimSpace(targetRoot) == "" {
		return CodexSkillsDir()
	}
	return targetRoot
}

func resolveCodexSkills(skillNames []string) ([]string, error) {
	approved := ApprovedCodexSkills()
	approvedSet := make(map[string]struct{}, len(approved))
	for _, skill := range approved {
		approvedSet[skill] = struct{}{}
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
		if _, ok := approvedSet[normalized]; !ok {
			return nil, fmt.Errorf("skill %q is not approved for codex; approved: %s", normalized, strings.Join(approved, ", "))
		}
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		resolved = append(resolved, normalized)
	}
	if len(resolved) == 0 {
		return nil, fmt.Errorf("at least one approved skill is required")
	}
	sort.Strings(resolved)
	return resolved, nil
}

func generateCodexSkill(targetRoot, commandBinDir, skill string) error {
	switch skill {
	case "cf-tunnel":
		return generateCodexCFTunnel(targetRoot, commandBinDir)
	case "google":
		return generateCodexGoogle(targetRoot, commandBinDir)
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
	return writeText(filepath.Join(refsDir, "commands.md"), renderCFTunnelCommands())
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
	return writeText(filepath.Join(refsDir, "commands.md"), renderGoogleCommands())
}

func helpCodex(targetRoot, skillName string) (SkillHelp, error) {
	targetRoot = defaultCodexTarget(targetRoot)
	skills, err := resolveCodexSkills([]string{skillName})
	if err != nil {
		return SkillHelp{}, err
	}
	skill := skills[0]
	path := filepath.Join(targetRoot, skill, "references", "help.md")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return SkillHelp{}, fmt.Errorf("skill %q help is missing at %s; install or update the skill first", skill, path)
		}
		return SkillHelp{}, err
	}
	return SkillHelp{
		Name: skill,
		Path: path,
		Text: string(data),
	}, nil
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

## Commands

Read [commands.md](./references/commands.md) for the full command shapes.
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

- command map: [commands.md](./commands.md)
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

## Commands

Read [commands.md](./references/commands.md) for the full command shapes.
`, commandBinDir, commandBinDir)
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

- command map: [commands.md](./commands.md)
`, commandBinDir)
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
