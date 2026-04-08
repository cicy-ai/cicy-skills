package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/cicy-ai/cicy-skills/internal/agentgen"
	"github.com/cicy-ai/cicy-skills/internal/bundle"
	"github.com/cicy-ai/cicy-skills/internal/config"
	"github.com/cicy-ai/cicy-skills/internal/skills"
	"github.com/cicy-ai/cicy-skills/internal/version"
)

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		printUsage(os.Stdout)
		return
	}

	switch args[0] {
	case "help", "-h", "--help":
		topic := ""
		if len(args) > 1 {
			topic = args[1]
		}
		if err := printHelp(os.Stdout, topic); err != nil {
			fmt.Fprintf(os.Stderr, "%v\n\n", err)
			printUsage(os.Stderr)
			os.Exit(1)
		}
	case "version":
		fmt.Println(version.Version)
	case "config-path":
		fmt.Println(config.DefaultPath())
	case "init-config":
		if err := config.WriteDefault("", false); err != nil {
			if os.IsExist(err) {
				fmt.Fprintf(os.Stderr, "config already exists: %s\n", config.DefaultPath())
				os.Exit(1)
			}
			fatal(err)
		}
		fmt.Println(config.DefaultPath())
	case "list":
		cfg, err := config.Load(os.Getenv("CICY_SKILLS_CONFIG"))
		if err != nil {
			fatal(err)
		}
		list, err := skills.Scan(cfg.SkillRoots)
		if err != nil {
			fatal(err)
		}
		for _, item := range list {
			fmt.Printf("%s\t%s\n", item.Category, item.Name)
		}
	case "nodes":
		cfg, err := config.Load(os.Getenv("CICY_SKILLS_CONFIG"))
		if err != nil {
			fatal(err)
		}
		for _, node := range cfg.Public().Nodes {
			marker := " "
			if node.IsDefault {
				marker = "*"
			}
			fmt.Printf("%s\t%s\t%s\n", marker, node.Name, node.BaseURL)
		}
	case "install":
		runInstall(args[1:])
	case "remove":
		runRemove(args[1:])
	case "update":
		runUpdate(args[1:])
	case "agent":
		runAgent(args[1:])
	case "serve":
		runServer()
	case "http-list":
		runHTTPList(args[1:])
	default:
		if strings.HasPrefix(args[0], "-") {
			printUsage(os.Stderr)
			return
		}
		printUsage(os.Stderr)
	}
}

func runServer() {
	cfg, err := config.Load(os.Getenv("CICY_SKILLS_CONFIG"))
	if err != nil {
		fatal(err)
	}
	req, _ := http.NewRequest(http.MethodGet, "http://"+cfg.Listen+"/healthz", nil)
	resp, err := http.DefaultClient.Do(req)
	if err == nil {
		resp.Body.Close()
		fmt.Printf("cicy-skillsd already responding on %s\n", cfg.Listen)
		return
	}
	fmt.Fprintf(os.Stderr, "serve via cicy-skillsd binary: listen=%s\n", cfg.Listen)
	os.Exit(1)
}

func runHTTPList(args []string) {
	cfg, err := config.Load(os.Getenv("CICY_SKILLS_CONFIG"))
	if err != nil {
		fatal(err)
	}
	nodeName, err := parseNodeFlag(args)
	if err != nil {
		fatal(err)
	}
	body, err := doNodeGET(cfg, nodeName, "/v1/skills")
	if err != nil {
		fatal(err)
	}
	_, _ = os.Stdout.Write(body)
}

func runInstall(args []string) {
	root, err := projectRoot()
	if err != nil {
		fatal(err)
	}
	target, err := parseInstallTarget(args, "install")
	if err != nil {
		fatal(err)
	}
	switch target {
	case "google-node":
		if err := installGoogleNode(root, bundle.RepoBinDir(root), bundle.DefaultGlobalBinDir()); err != nil {
			fatal(err)
		}
		fmt.Println("installed google-node")
	case "all":
		if err := installAll(root); err != nil {
			fatal(err)
		}
		fmt.Println("installed all local tools")
	default:
		fatal(fmt.Errorf("unknown provider: %s", args[0]))
	}
}

func runRemove(args []string) {
	root, err := projectRoot()
	if err != nil {
		fatal(err)
	}
	target, err := parseInstallTarget(args, "remove")
	if err != nil {
		fatal(err)
	}
	switch target {
	case "google-node":
		if err := bundle.RemoveProvider(bundle.RepoBinDir(root), bundle.DefaultGlobalBinDir()); err != nil {
			fatal(err)
		}
		fmt.Println("removed google-node")
	case "all":
		if err := bundle.Remove(bundle.RepoBinDir(root), bundle.DefaultGlobalBinDir()); err != nil {
			fatal(err)
		}
		fmt.Println("removed all local tools")
	default:
		fatal(fmt.Errorf("unknown provider: %s", target))
	}
}

func runUpdate(args []string) {
	root, err := projectRoot()
	if err != nil {
		fatal(err)
	}
	target, err := parseInstallTarget(args, "update")
	if err != nil {
		fatal(err)
	}
	switch target {
	case "google-node":
		if err := installGoogleNode(root, bundle.RepoBinDir(root), bundle.DefaultGlobalBinDir()); err != nil {
			fatal(err)
		}
		fmt.Println("updated google-node")
	case "all":
		if err := installAll(root); err != nil {
			fatal(err)
		}
		fmt.Println("updated all local tools")
	default:
		fatal(fmt.Errorf("unknown provider: %s", target))
	}
}

func installGoogleNode(root, privateBinDir, globalBinDir string) error {
	providerDir := filepath.Join(root, "providers", "google-node")
	if _, err := os.Stat(filepath.Join(providerDir, "package.json")); err != nil {
		return fmt.Errorf("google-node provider not found at %s", providerDir)
	}

	cmd := exec.Command("npm", "install")
	cmd.Dir = providerDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("npm install google-node: %w", err)
	}
	return bundle.InstallProvider(root, privateBinDir, globalBinDir)
}

func installAll(root string) error {
	repoBinDir := bundle.RepoBinDir(root)
	if err := installGoogleNode(root, repoBinDir, bundle.DefaultGlobalBinDir()); err != nil {
		return err
	}
	if err := bundle.Install(root, repoBinDir, bundle.DefaultGlobalBinDir()); err != nil {
		return err
	}
	return ensureConfigMigrated()
}

func runAgent(args []string) {
	if len(args) == 0 {
		fatal(errors.New("usage: cicy-skills agent <list|help|tools|generate|install|remove|update|sync> <codex|claude|openclaw> [args]"))
	}
	switch args[0] {
	case "list":
		profile, target, extra, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(extra) != 0 {
			fatal(errors.New("usage: cicy-skills agent list <codex|claude|openclaw> [--target DIR]"))
		}
		items, err := agentgen.List(profile, target)
		if err != nil {
			fatal(err)
		}
		for _, item := range items {
			fmt.Printf("%s\t%s\n", item.Name, item.Status)
		}
	case "help":
		profile, target, skills, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(skills) != 1 {
			fatal(errors.New("usage: cicy-skills agent help <codex|claude|openclaw> <skill> [--target DIR]"))
		}
		help, err := agentgen.Help(profile, target, skills[0])
		if err != nil {
			fatal(err)
		}
		fmt.Printf("%s\n\n", help.Path)
		fmt.Print(help.Text)
	case "tools":
		profile, target, skills, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(skills) != 1 {
			fatal(errors.New("usage: cicy-skills agent tools <codex|claude|openclaw> <skill> [--target DIR]"))
		}
		tools, err := agentgen.Tools(profile, target, skills[0])
		if err != nil {
			fatal(err)
		}
		fmt.Printf("%s\n\n", tools.Path)
		fmt.Print(tools.Text)
	case "generate":
		root, err := projectRoot()
		if err != nil {
			fatal(err)
		}
		profile, target, extra, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if target != "" && len(extra) != 0 {
			fatal(errors.New("usage: cicy-skills agent generate <codex|claude|openclaw> [target]"))
		}
		if len(extra) > 1 {
			fatal(errors.New("usage: cicy-skills agent generate <codex|claude|openclaw> [target]"))
		}
		if target == "" && len(extra) == 1 {
			target = extra[0]
		}
		if err := agentgen.Generate(root, profile, target, bundle.RepoBinDir(root)); err != nil {
			fatal(err)
		}
		if target == "" {
			target = defaultAgentTarget(profile)
		}
		fmt.Println(target)
	case "install":
		root, err := projectRoot()
		if err != nil {
			fatal(err)
		}
		profile, target, skills, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(skills) == 0 {
			fatal(errors.New("usage: cicy-skills agent install <codex|claude|openclaw> <skill...|all> [--target DIR]"))
		}
		installed, err := agentgen.Install(root, profile, target, bundle.RepoBinDir(root), skills)
		if err != nil {
			fatal(err)
		}
		printAgentSkillResults("installed", profile, target, installed)
	case "remove":
		profile, target, skills, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(skills) == 0 {
			fatal(errors.New("usage: cicy-skills agent remove <codex|claude|openclaw> <skill...|all> [--target DIR]"))
		}
		removed, err := agentgen.Remove(profile, target, skills)
		if err != nil {
			fatal(err)
		}
		printAgentSkillResults("removed", profile, target, removed)
	case "update":
		root, err := projectRoot()
		if err != nil {
			fatal(err)
		}
		profile, target, skills, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(skills) == 0 {
			fatal(errors.New("usage: cicy-skills agent update <codex|claude|openclaw> <skill...|all> [--target DIR]"))
		}
		updated, err := agentgen.Update(root, profile, target, bundle.RepoBinDir(root), skills)
		if err != nil {
			fatal(err)
		}
		printAgentSkillResults("updated", profile, target, updated)
	case "sync":
		root, err := projectRoot()
		if err != nil {
			fatal(err)
		}
		profile, target, extra, err := parseAgentProfileArgs(args[1:])
		if err != nil {
			fatal(err)
		}
		if len(extra) != 0 {
			fatal(errors.New("usage: cicy-skills agent sync <codex|claude|openclaw> [--target DIR]"))
		}
		synced, err := agentgen.Sync(root, profile, target, bundle.RepoBinDir(root))
		if err != nil {
			fatal(err)
		}
		printAgentSkillResults("synced", profile, target, synced)
	default:
		fatal(fmt.Errorf("unknown agent command: %s", args[0]))
	}
}

func ensureConfigMigrated() error {
	path := config.DefaultPath()
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		return config.WriteDefault("", false)
	}
	cfg, err := config.Load(path)
	if err != nil {
		return err
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	oldSkillRoot := filepath.Join(home, "Private", "skills")
	oldGeneratedRoot := filepath.Join(home, "Private", "cicy-skills", "generated", "skills")
	newSkillRoot := filepath.Join(home, "projects", "cicy-skills", "legacy", "skills")
	updated := false
	if len(cfg.SkillRoots) == 0 {
		cfg.SkillRoots = []string{newSkillRoot}
		updated = true
	} else {
		for i := range cfg.SkillRoots {
			root := config.ExpandPath(cfg.SkillRoots[i])
			if root == oldSkillRoot || root == oldGeneratedRoot {
				cfg.SkillRoots[i] = newSkillRoot
				updated = true
			}
		}
	}
	oldAgentDir := filepath.Join(home, "Private", "cicy-skills", "agents")
	oldGeneratedDir := filepath.Join(home, "Private", "cicy-skills", "generated")
	if config.ExpandPath(cfg.AgentProfilesDir) == oldAgentDir || cfg.AgentProfilesDir == "" {
		cfg.AgentProfilesDir = agentgen.CodexSkillsDir()
		updated = true
	}
	if config.ExpandPath(cfg.GeneratedDir) == oldGeneratedDir || cfg.GeneratedDir != "" {
		cfg.GeneratedDir = ""
		updated = true
	}
	if !updated {
		return nil
	}
	cfg = config.Normalize(cfg)
	cfg.SkillRoots = []string{newSkillRoot}
	cfg.AgentProfilesDir = agentgen.CodexSkillsDir()
	cfg.GeneratedDir = ""
	return config.Save(path, cfg)
}

func projectRoot() (string, error) {
	if root := strings.TrimSpace(os.Getenv("CICY_SKILLS_ROOT")); root != "" {
		return root, nil
	}

	wd, err := os.Getwd()
	if err == nil {
		if root, ok := findProjectRoot(wd); ok {
			return root, nil
		}
	}

	exe, err := os.Executable()
	if err == nil {
		if root, ok := findProjectRoot(filepath.Dir(exe)); ok {
			return root, nil
		}
	}

	return "", errors.New("cannot find cicy-skills project root; set CICY_SKILLS_ROOT")
}

func findProjectRoot(start string) (string, bool) {
	dir := start
	for {
		if isProjectRoot(dir) {
			return dir, true
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", false
		}
		dir = parent
	}
}

func isProjectRoot(dir string) bool {
	if _, err := os.Stat(filepath.Join(dir, "providers", "google-node", "package.json")); err != nil {
		return false
	}
	if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
		return true
	}
	if _, err := os.Stat(filepath.Join(dir, "legacy", "skills")); err == nil {
		return true
	}
	return false
}

func doNodeGET(cfg config.Config, nodeName, path string) ([]byte, error) {
	node, err := cfg.ResolveNode(nodeName)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodGet, strings.TrimRight(node.BaseURL, "/")+path, nil)
	if err != nil {
		return nil, err
	}
	if node.Token != "" {
		req.Header.Set("Authorization", "Bearer "+node.Token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("http %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return body, nil
}

func parseNodeFlag(args []string) (string, error) {
	if len(args) == 0 {
		return "", nil
	}
	for i, arg := range args {
		if arg == "--node" {
			if i+1 >= len(args) {
				return "", errors.New("missing value for --node")
			}
			return strings.TrimSpace(args[i+1]), nil
		}
		if strings.HasPrefix(arg, "--node=") {
			return strings.TrimSpace(strings.TrimPrefix(arg, "--node=")), nil
		}
	}
	if len(args) == 1 && !strings.HasPrefix(args[0], "-") {
		return strings.TrimSpace(args[0]), nil
	}
	return "", fmt.Errorf("unsupported args: %s", strings.Join(args, " "))
}

func parseInstallTarget(args []string, action string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("usage: cicy-skills %s <google-node|all>", action)
	}
	return strings.TrimSpace(args[0]), nil
}

func parseAgentProfileArgs(args []string) (string, string, []string, error) {
	if len(args) == 0 {
		return "", "", nil, errors.New("missing agent profile")
	}
	profile := strings.TrimSpace(args[0])
	rest := args[1:]
	target := ""
	filtered := make([]string, 0, len(rest))
	for i := 0; i < len(rest); i++ {
		arg := strings.TrimSpace(rest[i])
		switch {
		case arg == "--target":
			if i+1 >= len(rest) {
				return "", "", nil, errors.New("missing value for --target")
			}
			target = strings.TrimSpace(rest[i+1])
			i++
		case strings.HasPrefix(arg, "--target="):
			target = strings.TrimSpace(strings.TrimPrefix(arg, "--target="))
		default:
			filtered = append(filtered, arg)
		}
	}
	if profile == "" {
		return "", "", nil, errors.New("missing agent profile")
	}
	return profile, target, filtered, nil
}

func defaultAgentTarget(profile string) string {
	switch strings.ToLower(strings.TrimSpace(profile)) {
	case "codex":
		return agentgen.CodexSkillsDir()
	case "claude":
		return agentgen.ClaudeSkillsDir()
	case "openclaw":
		return agentgen.OpenClawSkillsDir()
	default:
		return ""
	}
}

func printAgentSkillResults(action, profile, target string, items []string) {
	if target == "" {
		target = defaultAgentTarget(profile)
	}
	fmt.Printf("%s\t%s\n", action, target)
	for _, item := range items {
		fmt.Printf("%s\t%s\n", item, filepath.Join(target, item))
	}
}

func printUsage(out io.Writer) {
	_ = printHelp(out, "")
}

func printHelp(out io.Writer, topic string) error {
	text, err := helpText(topic)
	if err != nil {
		return err
	}
	_, _ = fmt.Fprintln(out, text)
	return nil
}

func helpText(topic string) (string, error) {
	switch strings.TrimSpace(topic) {
	case "", "cicy-skills":
		return `cicy-skills

Usage:
  cicy-skills <command> [args]

Commands:
  help [command]         Show general or command-specific help
  version                Print CLI version
  config-path            Print the active config path
  init-config            Create the default config file
  list                   List discovered local skills
  nodes                  List configured nodes
  install <target>       Install providers / local command bundle
  remove <target>        Remove providers / local command bundle links
  update <target>        Refresh providers / local command bundle links
  agent <subcommand>     Manage agent-specific skill bundles
  http-list [--node N]   List skills from a configured node
  serve                  Check daemon status / hand off to cicy-skillsd

Examples:
  cicy-skills help install
  cicy-skills list
  cicy-skills install google-node
  cicy-skills install all
  cicy-skills agent help codex google
  cicy-skills agent install codex google
  cicy-skills agent sync codex
  cicy-skills http-list --node prod

Environment:
  CICY_SKILLS_CONFIG     Override config file path
  CICY_SKILLS_ROOT       Override project root for provider install`, nil
	case "help":
		return `Usage:
  cicy-skills help [command]

Show general help, or detailed help for a specific command.

Examples:
  cicy-skills help
  cicy-skills help install`, nil
	case "version":
		return `Usage:
  cicy-skills version

Print the cicy-skills CLI version.`, nil
	case "config-path":
		return `Usage:
  cicy-skills config-path

Print the config path that cicy-skills will use.`, nil
	case "init-config":
		return `Usage:
  cicy-skills init-config

Create the default config file at the standard config path.`, nil
	case "list":
		return `Usage:
  cicy-skills list

Scan configured skill roots and print discovered skills.`, nil
	case "nodes":
		return `Usage:
  cicy-skills nodes

Print configured nodes. The default node is marked with *.`, nil
	case "install":
		return `Usage:
  cicy-skills install <google-node|all>

Install providers and/or the local cicy-skills command bundle.

Targets:
  google-node            Install the embedded Google provider commands
  all                    Install every migrated command into ~/.local/bin
                         and the repo-owned bin directory`, nil
	case "remove":
		return `Usage:
  cicy-skills remove <google-node|all>

Remove provider or local command links from ~/.local/bin and the repo-owned bin directory.`, nil
	case "update":
		return `Usage:
  cicy-skills update <google-node|all>

Refresh provider or local command links.
For a full rebuild plus reinstall, use make install-local-cli.`, nil
	case "agent":
		return `Usage:
  cicy-skills agent list <codex|claude|openclaw> [--target DIR]
  cicy-skills agent help <codex|claude|openclaw> <skill> [--target DIR]
  cicy-skills agent tools <codex|claude|openclaw> <skill> [--target DIR]
  cicy-skills agent generate <codex|claude|openclaw> [target]
  cicy-skills agent install <codex|claude|openclaw> <skill...|all> [--target DIR]
  cicy-skills agent remove <codex|claude|openclaw> <skill...|all> [--target DIR]
  cicy-skills agent update <codex|claude|openclaw> <skill...|all> [--target DIR]
  cicy-skills agent sync <codex|claude|openclaw> [--target DIR]

Generate approved skills into each profile's default skills directory.
Default targets:
  codex      -> ~/.codex/skills
  claude     -> ~/.claude/skills
  openclaw   -> ~/.openclaw/skills

Currently approved:
  agent-webpage
  cf-tunnel
  globalApiToken
  google
  tm

Examples:
  cicy-skills agent help codex agent-webpage
  cicy-skills agent tools codex agent-webpage
  cicy-skills agent help codex google
  cicy-skills agent help codex tm
  cicy-skills agent help claude globalApiToken
  cicy-skills agent help openclaw cf-tunnel
  cicy-skills agent generate codex
  cicy-skills agent generate claude
  cicy-skills agent generate openclaw
  cicy-skills agent install codex cf-tunnel
  cicy-skills agent install codex tm
  cicy-skills agent install claude globalApiToken
  cicy-skills agent install claude tm
  cicy-skills agent install openclaw google
  cicy-skills agent install openclaw tm
  cicy-skills agent remove claude globalApiToken
  cicy-skills agent remove openclaw google
  cicy-skills agent sync codex
  cicy-skills agent sync claude
  cicy-skills agent sync openclaw`, nil
	case "http-list":
		return `Usage:
  cicy-skills http-list [--node NAME]
  cicy-skills http-list [NAME]

Fetch the skill list from a configured node over HTTP.`, nil
	case "serve":
		return `Usage:
  cicy-skills serve

Check whether cicy-skillsd is already responding.
If it is not running, cicy-skills prints the listen address and exits.`, nil
	default:
		return "", fmt.Errorf("unknown help topic: %s", topic)
	}
}

func fatal(err error) {
	out, _ := json.Marshal(map[string]string{"error": err.Error()})
	fmt.Fprintln(os.Stderr, string(out))
	os.Exit(1)
}
