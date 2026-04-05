package hosttools

import (
	"bytes"
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
