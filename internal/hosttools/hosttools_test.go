package hosttools

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunCFTunnelHelpDoesNotRequireConfig(t *testing.T) {
	var stdout bytes.Buffer
	env := &Env{
		Stdout: &stdout,
		Stderr: &bytes.Buffer{},
	}

	if err := env.runCFTunnel([]string{"help"}); err != nil {
		t.Fatalf("runCFTunnel(help) error = %v", err)
	}

	out := stdout.String()
	if !strings.Contains(out, "Usage: cf-tunnel <list|add|del> [ports...]") {
		t.Fatalf("unexpected stdout: %q", out)
	}
	if !strings.Contains(out, "CF_ENV=prod|dev") {
		t.Fatalf("missing environment help: %q", out)
	}
}

func TestRunGlobalAPITokenShow(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	if err := os.WriteFile(filepath.Join(home, "global.json"), []byte("{\"api_token\":\"cicy_test_show\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	var stdout bytes.Buffer
	env, err := newEnv(&stdout, &bytes.Buffer{})
	if err != nil {
		t.Fatalf("newEnv() error = %v", err)
	}
	if err := env.runGlobalAPIToken([]string{"show"}); err != nil {
		t.Fatalf("runGlobalAPIToken(show) error = %v", err)
	}
	if got := strings.TrimSpace(stdout.String()); got != "cicy_test_show" {
		t.Fatalf("show output = %q", got)
	}
}

func TestRunGlobalAPITokenRefresh(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	path := filepath.Join(home, "global.json")
	if err := os.WriteFile(path, []byte("{\"api_token\":\"cicy_old\",\"other\":1}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	var stdout bytes.Buffer
	env, err := newEnv(&stdout, &bytes.Buffer{})
	if err != nil {
		t.Fatalf("newEnv() error = %v", err)
	}
	if err := env.runGlobalAPIToken([]string{"refresh"}); err != nil {
		t.Fatalf("runGlobalAPIToken(refresh) error = %v", err)
	}

	newToken := strings.TrimSpace(stdout.String())
	if !strings.HasPrefix(newToken, "cicy_") {
		t.Fatalf("refresh output = %q", newToken)
	}
	if newToken == "cicy_old" {
		t.Fatalf("refresh did not change token")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}
	if !strings.Contains(string(data), newToken) {
		t.Fatalf("global.json not updated: %s", string(data))
	}
	if !strings.Contains(string(data), "\"other\": 1") {
		t.Fatalf("global.json lost unrelated fields: %s", string(data))
	}
}
