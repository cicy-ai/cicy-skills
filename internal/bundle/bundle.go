package bundle

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
)

type LinkSpec struct {
	Name   string
	Source string
}

type CommandGroup struct {
	Name     string
	Commands []string
}

var (
	BinaryLinks = []LinkSpec{
		{Name: "cicy-skills", Source: "dist/cicy-skills"},
		{Name: "cicy-skillsd", Source: "dist/cicy-skillsd"},
		{Name: "cicy-hosttools", Source: "dist/cicy-hosttools"},
		{Name: "stt", Source: "dist/stt"},
		{Name: "tts", Source: "dist/tts"},
	}
	HosttoolAliases = []string{
		"agent-webpage",
		"agent-page-ping",
		"cf-tunnel",
		"cf-tunnel-py",
		"cf-tunnel.py",
		"cping",
		"eng",
		"gemini-ask",
		"gemini-vision",
		"globalApiToken",
		"gpt",
		"gpt-chat",
		"ipc-ping",
		"mysql-exec",
		"tg",
		"tm",
		"todo",
		"webpage",
		"webpage-ping",
	}
	ProviderLinks = []LinkSpec{
		{Name: "google", Source: "providers/google-node/google.js"},
	}
	DeprecatedProviderLinks = []string{"gmail"}
	RetiredLocalLinks       = []string{
		"aeng-page-exec",
		"ai-desktop-check",
		"check-all",
		"check-projects",
		"electron-mcp-ui-check",
		"fast-api",
		"fast-api-check",
		"grant-trial-credit",
	}
	LegacyLinks = []LinkSpec{
		{Name: "ax-click", Source: "legacy/skills/dev/ax-click"},
		{Name: "ax-tree", Source: "legacy/skills/dev/ax-tree"},
		{Name: "tg-bot-check", Source: "legacy/skills/services/tg-bot-check.sh"},
		{Name: "vphone-ctl", Source: "legacy/skills/dev/vphone-ctl"},
		{Name: "xui", Source: "legacy/skills/dev/xui"},
	}
	CommandGroups = []CommandGroup{
		{Name: "Core", Commands: []string{"cicy-skills", "cicy-skillsd", "cicy-hosttools", "stt", "tts"}},
		{Name: "Google", Commands: []string{"google"}},
		{Name: "Migrated Host Tools", Commands: append([]string(nil), HosttoolAliases...)},
		{Name: "Legacy Host Scripts", Commands: commandNames(LegacyLinks)},
	}
)

func commandNames(items []LinkSpec) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		out = append(out, item.Name)
	}
	sort.Strings(out)
	return out
}

func DefaultPrivateDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join("~", "Private", "cicy-skills")
	}
	return filepath.Join(home, "Private", "cicy-skills")
}

func RepoBinDir(root string) string {
	return filepath.Join(root, "bin")
}

func DefaultGlobalBinDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join("~", ".local", "bin")
	}
	return filepath.Join(home, ".local", "bin")
}

func DefaultSkillRootDir() string {
	return filepath.Join(DefaultPrivateDir(), "generated", "skills")
}

func DefaultAgentOutputDir() string {
	return filepath.Join(DefaultPrivateDir(), "generated", "agents")
}

func AllCommands() []string {
	seen := map[string]struct{}{}
	var out []string
	for _, spec := range BinaryLinks {
		seen[spec.Name] = struct{}{}
		out = append(out, spec.Name)
	}
	for _, name := range HosttoolAliases {
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		out = append(out, name)
	}
	for _, spec := range ProviderLinks {
		if _, ok := seen[spec.Name]; ok {
			continue
		}
		seen[spec.Name] = struct{}{}
		out = append(out, spec.Name)
	}
	for _, spec := range LegacyLinks {
		if _, ok := seen[spec.Name]; ok {
			continue
		}
		seen[spec.Name] = struct{}{}
		out = append(out, spec.Name)
	}
	sort.Strings(out)
	return out
}

func Install(root, privateBinDir, globalBinDir string) error {
	if root == "" {
		return fmt.Errorf("project root is required")
	}
	if privateBinDir == "" {
		privateBinDir = RepoBinDir(root)
	}
	if globalBinDir == "" {
		globalBinDir = DefaultGlobalBinDir()
	}
	if err := os.MkdirAll(privateBinDir, 0o755); err != nil {
		return err
	}
	if err := os.MkdirAll(globalBinDir, 0o755); err != nil {
		return err
	}

	for _, spec := range BinaryLinks {
		if err := forceSymlink(filepath.Join(root, filepath.FromSlash(spec.Source)), filepath.Join(privateBinDir, spec.Name)); err != nil {
			return err
		}
	}
	hosttoolPath := filepath.Join(privateBinDir, "cicy-hosttools")
	for _, name := range HosttoolAliases {
		if err := forceSymlink(hosttoolPath, filepath.Join(privateBinDir, name)); err != nil {
			return err
		}
	}
	for _, spec := range ProviderLinks {
		if err := forceSymlink(filepath.Join(root, filepath.FromSlash(spec.Source)), filepath.Join(privateBinDir, spec.Name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(privateBinDir, name)); err != nil {
			return err
		}
	}
	for _, spec := range LegacyLinks {
		if err := forceSymlink(filepath.Join(root, filepath.FromSlash(spec.Source)), filepath.Join(privateBinDir, spec.Name)); err != nil {
			return err
		}
	}
	if err := removeLinks(privateBinDir, RetiredLocalLinks); err != nil {
		return err
	}

	for _, name := range AllCommands() {
		if err := forceSymlink(filepath.Join(privateBinDir, name), filepath.Join(globalBinDir, name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(globalBinDir, name)); err != nil {
			return err
		}
	}
	if err := removeLinks(globalBinDir, RetiredLocalLinks); err != nil {
		return err
	}
	return nil
}

func InstallProvider(root, privateBinDir, globalBinDir string) error {
	if root == "" {
		return fmt.Errorf("project root is required")
	}
	if privateBinDir == "" {
		privateBinDir = RepoBinDir(root)
	}
	if globalBinDir == "" {
		globalBinDir = DefaultGlobalBinDir()
	}
	if err := os.MkdirAll(privateBinDir, 0o755); err != nil {
		return err
	}
	if err := os.MkdirAll(globalBinDir, 0o755); err != nil {
		return err
	}
	for _, spec := range ProviderLinks {
		if err := forceSymlink(filepath.Join(root, filepath.FromSlash(spec.Source)), filepath.Join(privateBinDir, spec.Name)); err != nil {
			return err
		}
		if err := forceSymlink(filepath.Join(privateBinDir, spec.Name), filepath.Join(globalBinDir, spec.Name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(privateBinDir, name)); err != nil {
			return err
		}
		if err := removeLink(filepath.Join(globalBinDir, name)); err != nil {
			return err
		}
	}
	return nil
}

func Remove(privateBinDir, globalBinDir string) error {
	if privateBinDir == "" {
		return fmt.Errorf("private bin dir is required")
	}
	if globalBinDir == "" {
		globalBinDir = DefaultGlobalBinDir()
	}

	for _, name := range AllCommands() {
		if err := removeLink(filepath.Join(globalBinDir, name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(globalBinDir, name)); err != nil {
			return err
		}
	}
	for _, name := range AllCommands() {
		if err := removeLink(filepath.Join(privateBinDir, name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(privateBinDir, name)); err != nil {
			return err
		}
	}
	if err := removeLinks(globalBinDir, RetiredLocalLinks); err != nil {
		return err
	}
	if err := removeLinks(privateBinDir, RetiredLocalLinks); err != nil {
		return err
	}
	return nil
}

func RemoveProvider(privateBinDir, globalBinDir string) error {
	if privateBinDir == "" {
		return fmt.Errorf("private bin dir is required")
	}
	if globalBinDir == "" {
		globalBinDir = DefaultGlobalBinDir()
	}
	for _, spec := range ProviderLinks {
		if err := removeLink(filepath.Join(globalBinDir, spec.Name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(globalBinDir, name)); err != nil {
			return err
		}
	}
	for _, spec := range ProviderLinks {
		if err := removeLink(filepath.Join(privateBinDir, spec.Name)); err != nil {
			return err
		}
	}
	for _, name := range DeprecatedProviderLinks {
		if err := removeLink(filepath.Join(privateBinDir, name)); err != nil {
			return err
		}
	}
	return nil
}

func forceSymlink(target, link string) error {
	if err := os.MkdirAll(filepath.Dir(link), 0o755); err != nil {
		return err
	}
	_ = os.Remove(link)
	return os.Symlink(target, link)
}

func removeLink(path string) error {
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func removeLinks(dir string, names []string) error {
	for _, name := range names {
		if err := removeLink(filepath.Join(dir, name)); err != nil {
			return err
		}
	}
	return nil
}

func SyncSkillTree(root, target string) error {
	source := filepath.Join(root, "legacy", "skills")
	return syncTree(source, target, map[string]bool{"bin": true, "__pycache__": true})
}

func syncTree(source, target string, skipDirs map[string]bool) error {
	if samePath(source, target) {
		return nil
	}
	if _, err := os.Stat(source); err != nil {
		if _, targetErr := os.Stat(target); targetErr == nil {
			return nil
		}
		return err
	}
	if err := os.RemoveAll(target); err != nil {
		return err
	}
	return filepath.WalkDir(source, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		if rel == "." {
			return os.MkdirAll(target, 0o755)
		}
		if d.IsDir() {
			if skipDirs[d.Name()] {
				return filepath.SkipDir
			}
			return os.MkdirAll(filepath.Join(target, rel), 0o755)
		}
		if d.Name() == "link-skills.sh" {
			return nil
		}
		if d.Type()&os.ModeSymlink != 0 {
			return copySymlink(path, filepath.Join(target, rel))
		}
		return copyFile(path, filepath.Join(target, rel))
	})
}

func copyFile(source, target string) error {
	info, err := os.Stat(source)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return err
	}
	in, err := os.Open(source)
	if err != nil {
		return err
	}
	defer in.Close()

	tmp, err := os.CreateTemp(filepath.Dir(target), "."+filepath.Base(target)+".tmp-*")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	defer func() {
		_ = os.Remove(tmpPath)
	}()
	if err := tmp.Chmod(info.Mode().Perm()); err != nil {
		tmp.Close()
		return err
	}

	if _, err := io.Copy(tmp, in); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpPath, target)
}

func copySymlink(source, target string) error {
	value, err := os.Readlink(source)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return err
	}
	_ = os.Remove(target)
	return os.Symlink(value, target)
}

func samePath(a, b string) bool {
	return filepath.Clean(a) == filepath.Clean(b)
}
