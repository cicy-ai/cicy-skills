package agentgen

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCodexInstallListRemove(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")

	installed, err := Install("", "codex", targetRoot, commandBinDir, []string{"google"})
	if err != nil {
		t.Fatalf("Install() error = %v", err)
	}
	if len(installed) != 1 || installed[0] != "google" {
		t.Fatalf("Install() installed = %#v", installed)
	}

	skillPath := filepath.Join(targetRoot, "google", "SKILL.md")
	data, err := os.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", skillPath, err)
	}
	if !strings.Contains(string(data), commandBinDir) {
		t.Fatalf("SKILL.md missing command bin dir %q: %s", commandBinDir, string(data))
	}

	listed, err := List("codex", targetRoot)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	foundInstalledGoogle := false
	for _, item := range listed {
		if item.Name == "google" && item.Status == "installed" {
			foundInstalledGoogle = true
			break
		}
	}
	if !foundInstalledGoogle {
		t.Fatalf("List() = %#v", listed)
	}

	removed, err := Remove("codex", targetRoot, []string{"google"})
	if err != nil {
		t.Fatalf("Remove() error = %v", err)
	}
	if len(removed) != 1 || removed[0] != "google" {
		t.Fatalf("Remove() removed = %#v", removed)
	}
	if _, err := os.Stat(filepath.Join(targetRoot, "google")); !os.IsNotExist(err) {
		t.Fatalf("google skill directory still exists: err=%v", err)
	}
}

func TestCodexInstallCFTunnel(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")

	installed, err := Install("", "codex", targetRoot, commandBinDir, []string{"cf-tunnel"})
	if err != nil {
		t.Fatalf("Install() error = %v", err)
	}
	if len(installed) != 1 || installed[0] != "cf-tunnel" {
		t.Fatalf("Install() installed = %#v", installed)
	}

	skillPath := filepath.Join(targetRoot, "cf-tunnel", "SKILL.md")
	data, err := os.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", skillPath, err)
	}
	text := string(data)
	if !strings.Contains(text, commandBinDir) {
		t.Fatalf("SKILL.md missing command bin dir %q: %s", commandBinDir, text)
	}
	if !strings.Contains(text, "`cf-tunnel`") {
		t.Fatalf("SKILL.md missing cf-tunnel command reference: %s", text)
	}
	helpPath := filepath.Join(targetRoot, "cf-tunnel", "references", "help.md")
	helpData, err := os.ReadFile(helpPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", helpPath, err)
	}
	if !strings.Contains(string(helpData), "cf-tunnel add 8101") {
		t.Fatalf("help.md missing quick start example: %s", string(helpData))
	}
	toolsPath := filepath.Join(targetRoot, "cf-tunnel", "references", "tools.md")
	toolsData, err := os.ReadFile(toolsPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", toolsPath, err)
	}
	if !strings.Contains(string(toolsData), "cf-tunnel list") {
		t.Fatalf("tools.md missing list example: %s", string(toolsData))
	}
}

func TestCodexInstallGlobalAPIToken(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")

	installed, err := Install("", "codex", targetRoot, commandBinDir, []string{"globalApiToken"})
	if err != nil {
		t.Fatalf("Install() error = %v", err)
	}
	if len(installed) != 1 || installed[0] != "globalApiToken" {
		t.Fatalf("Install() installed = %#v", installed)
	}

	skillPath := filepath.Join(targetRoot, "globalApiToken", "SKILL.md")
	data, err := os.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", skillPath, err)
	}
	text := string(data)
	if !strings.Contains(text, commandBinDir) {
		t.Fatalf("SKILL.md missing command bin dir %q: %s", commandBinDir, text)
	}
	if !strings.Contains(text, "`globalApiToken`") {
		t.Fatalf("SKILL.md missing command reference: %s", text)
	}
	helpPath := filepath.Join(targetRoot, "globalApiToken", "references", "help.md")
	helpData, err := os.ReadFile(helpPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", helpPath, err)
	}
	if !strings.Contains(string(helpData), "globalApiToken refresh") {
		t.Fatalf("help.md missing refresh example: %s", string(helpData))
	}
}

func TestCodexInstallAgentWebpage(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")

	installed, err := Install("", "codex", targetRoot, commandBinDir, []string{"agent-webpage"})
	if err != nil {
		t.Fatalf("Install() error = %v", err)
	}
	if len(installed) != 1 || installed[0] != "agent-webpage" {
		t.Fatalf("Install() installed = %#v", installed)
	}

	skillPath := filepath.Join(targetRoot, "agent-webpage", "SKILL.md")
	data, err := os.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", skillPath, err)
	}
	text := string(data)
	if !strings.Contains(text, "`agent-webpage`") {
		t.Fatalf("SKILL.md missing command reference: %s", text)
	}
	helpPath := filepath.Join(targetRoot, "agent-webpage", "references", "help.md")
	helpData, err := os.ReadFile(helpPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", helpPath, err)
	}
	if !strings.Contains(string(helpData), "agent-webpage ping") {
		t.Fatalf("help.md missing ping example: %s", string(helpData))
	}
	toolsPath := filepath.Join(targetRoot, "agent-webpage", "references", "tools.md")
	toolsData, err := os.ReadFile(toolsPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", toolsPath, err)
	}
	if !strings.Contains(string(toolsData), "exec_js_result") {
		t.Fatalf("tools.md missing exec_js_result response mapping: %s", string(toolsData))
	}
}

func TestCodexInstallTM(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")

	installed, err := Install("", "codex", targetRoot, commandBinDir, []string{"tm"})
	if err != nil {
		t.Fatalf("Install() error = %v", err)
	}
	if len(installed) != 1 || installed[0] != "tm" {
		t.Fatalf("Install() installed = %#v", installed)
	}

	skillPath := filepath.Join(targetRoot, "tm", "SKILL.md")
	data, err := os.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", skillPath, err)
	}
	text := string(data)
	if !strings.Contains(text, "`tm`") {
		t.Fatalf("SKILL.md missing tm command reference: %s", text)
	}
	if !strings.Contains(text, commandBinDir) {
		t.Fatalf("SKILL.md missing command bin dir %q: %s", commandBinDir, text)
	}

	helpPath := filepath.Join(targetRoot, "tm", "references", "help.md")
	helpData, err := os.ReadFile(helpPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", helpPath, err)
	}
	if !strings.Contains(string(helpData), "tm ls") {
		t.Fatalf("help.md missing tm ls example: %s", string(helpData))
	}

	toolsPath := filepath.Join(targetRoot, "tm", "references", "tools.md")
	toolsData, err := os.ReadFile(toolsPath)
	if err != nil {
		t.Fatalf("ReadFile(%s) error = %v", toolsPath, err)
	}
	if !strings.Contains(string(toolsData), "cicy-code -n node-a panes") {
		t.Fatalf("tools.md missing node-aware example: %s", string(toolsData))
	}
}

func TestCodexListShowsExternalDirs(t *testing.T) {
	targetRoot := t.TempDir()
	if err := os.MkdirAll(filepath.Join(targetRoot, "manual-skill"), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.MkdirAll(filepath.Join(targetRoot, ".system"), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}

	listed, err := List("codex", targetRoot)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	foundGoogle := false
	foundCFTunnel := false
	foundGlobalAPIToken := false
	foundAgentWebpage := false
	foundTM := false
	foundExternal := false
	for _, item := range listed {
		if item.Name == "agent-webpage" && item.Status == "missing" {
			foundAgentWebpage = true
		}
		if item.Name == "cf-tunnel" && item.Status == "missing" {
			foundCFTunnel = true
		}
		if item.Name == "globalApiToken" && item.Status == "missing" {
			foundGlobalAPIToken = true
		}
		if item.Name == "google" && item.Status == "missing" {
			foundGoogle = true
		}
		if item.Name == "tm" && item.Status == "missing" {
			foundTM = true
		}
		if item.Name == "manual-skill" && item.Status == "external" {
			foundExternal = true
		}
	}
	if !foundGoogle {
		t.Fatalf("List() missing google status: %#v", listed)
	}
	if !foundAgentWebpage {
		t.Fatalf("List() missing agent-webpage status: %#v", listed)
	}
	if !foundCFTunnel {
		t.Fatalf("List() missing cf-tunnel status: %#v", listed)
	}
	if !foundGlobalAPIToken {
		t.Fatalf("List() missing globalApiToken status: %#v", listed)
	}
	if !foundTM {
		t.Fatalf("List() missing tm status: %#v", listed)
	}
	if !foundExternal {
		t.Fatalf("List() missing external status: %#v", listed)
	}
}

func TestCodexRejectsUnapprovedSkills(t *testing.T) {
	_, err := Install("", "codex", t.TempDir(), "/tmp/bin", []string{"not-approved"})
	if err == nil {
		t.Fatal("Install() expected error for unapproved skill")
	}
	if !strings.Contains(err.Error(), "not approved") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCodexSyncPreservesExternalDirs(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")
	externalDir := filepath.Join(targetRoot, "manual-external")
	externalFile := filepath.Join(externalDir, "SKILL.md")
	if err := os.MkdirAll(externalDir, 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(externalFile, []byte("external skill"), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	synced, err := Sync("", "codex", targetRoot, commandBinDir)
	if err != nil {
		t.Fatalf("Sync() error = %v", err)
	}
	if len(synced) != len(ApprovedCodexSkills()) {
		t.Fatalf("Sync() synced = %#v", synced)
	}
	if _, err := os.Stat(externalFile); err != nil {
		t.Fatalf("external skill was touched: %v", err)
	}
}

func TestCodexHelpReadsGeneratedHelp(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")
	if _, err := Install("", "codex", targetRoot, commandBinDir, []string{"google"}); err != nil {
		t.Fatalf("Install() error = %v", err)
	}

	help, err := Help("codex", targetRoot, "google")
	if err != nil {
		t.Fatalf("Help() error = %v", err)
	}
	if help.Name != "google" {
		t.Fatalf("Help() name = %q", help.Name)
	}
	if !strings.Contains(help.Path, "google/references/help.md") {
		t.Fatalf("Help() path = %q", help.Path)
	}
	if !strings.Contains(help.Text, "# Google Help") {
		t.Fatalf("Help() text = %q", help.Text)
	}
}

func TestCodexHelpReadsGeneratedTMHelp(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")
	if _, err := Install("", "codex", targetRoot, commandBinDir, []string{"tm"}); err != nil {
		t.Fatalf("Install() error = %v", err)
	}

	help, err := Help("codex", targetRoot, "tm")
	if err != nil {
		t.Fatalf("Help() error = %v", err)
	}
	if help.Name != "tm" {
		t.Fatalf("Help() name = %q", help.Name)
	}
	if !strings.Contains(help.Path, "tm/references/help.md") {
		t.Fatalf("Help() path = %q", help.Path)
	}
	if !strings.Contains(help.Text, "# tm Help") {
		t.Fatalf("Help() text = %q", help.Text)
	}
}

func TestCodexToolsReadsGeneratedTMTools(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")
	if _, err := Install("", "codex", targetRoot, commandBinDir, []string{"tm"}); err != nil {
		t.Fatalf("Install() error = %v", err)
	}

	tools, err := Tools("codex", targetRoot, "tm")
	if err != nil {
		t.Fatalf("Tools() error = %v", err)
	}
	if tools.Name != "tm" {
		t.Fatalf("Tools() name = %q", tools.Name)
	}
	if !strings.Contains(tools.Path, "tm/references/tools.md") {
		t.Fatalf("Tools() path = %q", tools.Path)
	}
	if !strings.Contains(tools.Text, "tm Command Reference") {
		t.Fatalf("Tools() text = %q", tools.Text)
	}
}

func TestCodexToolsReadsGeneratedTools(t *testing.T) {
	targetRoot := t.TempDir()
	commandBinDir := filepath.Join(targetRoot, "bin")
	if _, err := Install("", "codex", targetRoot, commandBinDir, []string{"agent-webpage"}); err != nil {
		t.Fatalf("Install() error = %v", err)
	}

	tools, err := Tools("codex", targetRoot, "agent-webpage")
	if err != nil {
		t.Fatalf("Tools() error = %v", err)
	}
	if tools.Name != "agent-webpage" {
		t.Fatalf("Tools() name = %q", tools.Name)
	}
	if !strings.Contains(tools.Path, "agent-webpage/references/tools.md") {
		t.Fatalf("Tools() path = %q", tools.Path)
	}
	if !strings.Contains(tools.Text, "webpage_pong") {
		t.Fatalf("Tools() text = %q", tools.Text)
	}
}
