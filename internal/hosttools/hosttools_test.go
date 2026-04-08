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

func TestRunTMHelpDoesNotRequireConfig(t *testing.T) {
	var stdout bytes.Buffer
	env := &Env{
		Stdout: &stdout,
		Stderr: &bytes.Buffer{},
	}

	if err := env.runTM([]string{"help"}); err != nil {
		t.Fatalf("runTM(help) error = %v", err)
	}

	out := stdout.String()
	if !strings.Contains(out, "Usage: tm [--node NAME] <command> [args]") {
		t.Fatalf("unexpected stdout: %q", out)
	}
	if !strings.Contains(out, "TM_API_BASE or API_BASE") {
		t.Fatalf("missing config priority: %q", out)
	}
	if !strings.Contains(out, "~/Private/tm.json") {
		t.Fatalf("missing tm.json path: %q", out)
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

func TestResolveTMConfigUsesDefaultNodeFromGlobal(t *testing.T) {
	env := &Env{
		Global: map[string]any{
			"api_token": "global_token",
		},
		TM: map[string]any{
			"default": "prod",
			"nodes": map[string]any{
				"prod": map[string]any{
					"api":       "http://10.0.0.12:8008",
					"api_token": "tm_prod_token",
				},
			},
		},
	}

	cfg, err := env.resolveTMConfig("")
	if err != nil {
		t.Fatalf("resolveTMConfig() error = %v", err)
	}
	if cfg.Node != "prod" {
		t.Fatalf("cfg.Node = %q", cfg.Node)
	}
	if cfg.API != "http://10.0.0.12:8008" {
		t.Fatalf("cfg.API = %q", cfg.API)
	}
	if cfg.Token != "tm_prod_token" {
		t.Fatalf("cfg.Token = %q", cfg.Token)
	}
}

func TestResolveTMConfigUsesTMNodeEnv(t *testing.T) {
	t.Setenv("TM_NODE", "dev")
	env := &Env{
		Global: map[string]any{
			"api_token": "global_token",
		},
		TM: map[string]any{
			"nodes": map[string]any{
				"dev": map[string]any{
					"api":       "http://10.0.0.20:8008",
					"api_token": "dev_token",
				},
			},
		},
	}

	cfg, err := env.resolveTMConfig("")
	if err != nil {
		t.Fatalf("resolveTMConfig() error = %v", err)
	}
	if cfg.Node != "dev" {
		t.Fatalf("cfg.Node = %q", cfg.Node)
	}
	if cfg.API != "http://10.0.0.20:8008" {
		t.Fatalf("cfg.API = %q", cfg.API)
	}
	if cfg.Token != "dev_token" {
		t.Fatalf("cfg.Token = %q", cfg.Token)
	}
}

func TestResolveTMConfigUsesEnvOverride(t *testing.T) {
	t.Setenv("TM_API_BASE", "http://127.0.0.1:9001")
	t.Setenv("TM_TOKEN", "tm_env_token")
	env := &Env{
		Global: map[string]any{
			"api_token": "global_token",
		},
		TM: map[string]any{
			"default": "prod",
			"nodes": map[string]any{
				"prod": map[string]any{
					"api":       "http://10.0.0.12:8008",
					"api_token": "prod_token",
				},
			},
		},
	}

	cfg, err := env.resolveTMConfig("")
	if err != nil {
		t.Fatalf("resolveTMConfig() error = %v", err)
	}
	if cfg.API != "http://127.0.0.1:9001" {
		t.Fatalf("cfg.API = %q", cfg.API)
	}
	if cfg.Token != "tm_env_token" {
		t.Fatalf("cfg.Token = %q", cfg.Token)
	}
}

func TestResolveTMConfigUsesInMemoryDefaultWhenTMJSONMissing(t *testing.T) {
	env := &Env{
		Global: map[string]any{
			"api_token": "cicy_root_token",
		},
		TM: map[string]any{},
	}

	cfg, err := env.resolveTMConfig("")
	if err != nil {
		t.Fatalf("resolveTMConfig() error = %v", err)
	}
	if cfg.Node != "default" {
		t.Fatalf("cfg.Node = %q", cfg.Node)
	}
	if cfg.API != "http://127.0.0.1:8008" {
		t.Fatalf("cfg.API = %q", cfg.API)
	}
	if cfg.Token != "cicy_root_token" {
		t.Fatalf("cfg.Token = %q", cfg.Token)
	}
}

func TestResolveTMConfigRequiresNodeSpecificToken(t *testing.T) {
	env := &Env{
		Global: map[string]any{
			"api_token": "global_token",
		},
		TM: map[string]any{
			"default": "prod",
			"nodes": map[string]any{
				"prod": map[string]any{
					"api": "http://10.0.0.12:8008",
				},
			},
		},
	}

	_, err := env.resolveTMConfig("")
	if err == nil {
		t.Fatal("resolveTMConfig() expected error for missing node token")
	}
	if !strings.Contains(err.Error(), "missing api_token") {
		t.Fatalf("unexpected error: %v", err)
	}
}
