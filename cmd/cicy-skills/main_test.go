package main

import (
	"strings"
	"testing"
)

func TestHelpTextGeneral(t *testing.T) {
	got, err := helpText("")
	if err != nil {
		t.Fatalf("helpText() error = %v", err)
	}

	for _, want := range []string{
		"Usage:",
		"cicy-skills <command> [args]",
		"help [command]",
		"install <target>",
		"remove <target>",
		"update <target>",
		"CICY_SKILLS_CONFIG",
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("helpText() missing %q in %q", want, got)
		}
	}
}

func TestHelpTextInstall(t *testing.T) {
	got, err := helpText("install")
	if err != nil {
		t.Fatalf("helpText(install) error = %v", err)
	}
	if !strings.Contains(got, "cicy-skills install <google-node|all>") {
		t.Fatalf("install help missing usage line: %q", got)
	}
	if !strings.Contains(got, "google-node") {
		t.Fatalf("install help missing provider list: %q", got)
	}
	if !strings.Contains(got, "all") {
		t.Fatalf("install help missing all target: %q", got)
	}
}

func TestHelpTextRemove(t *testing.T) {
	got, err := helpText("remove")
	if err != nil {
		t.Fatalf("helpText(remove) error = %v", err)
	}
	if !strings.Contains(got, "cicy-skills remove <google-node|all>") {
		t.Fatalf("remove help missing usage line: %q", got)
	}
}

func TestHelpTextUpdate(t *testing.T) {
	got, err := helpText("update")
	if err != nil {
		t.Fatalf("helpText(update) error = %v", err)
	}
	if !strings.Contains(got, "cicy-skills update <google-node|all>") {
		t.Fatalf("update help missing usage line: %q", got)
	}
	if !strings.Contains(got, "make install-local-cli") {
		t.Fatalf("update help missing rebuild guidance: %q", got)
	}
}

func TestHelpTextUnknownTopic(t *testing.T) {
	_, err := helpText("missing")
	if err == nil {
		t.Fatal("helpText(missing) expected error")
	}
	if !strings.Contains(err.Error(), "unknown help topic") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestHelpTextAgent(t *testing.T) {
	got, err := helpText("agent")
	if err != nil {
		t.Fatalf("helpText(agent) error = %v", err)
	}
	if !strings.Contains(got, "cicy-skills agent generate codex [target]") {
		t.Fatalf("agent help missing usage line: %q", got)
	}
	for _, want := range []string{
		"cicy-skills agent list codex [--target DIR]",
		"cicy-skills agent help codex <skill> [--target DIR]",
		"cicy-skills agent install codex <skill...|all> [--target DIR]",
		"cicy-skills agent remove codex <skill...|all> [--target DIR]",
		"cicy-skills agent update codex <skill...|all> [--target DIR]",
		"cicy-skills agent sync codex [--target DIR]",
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("agent help missing %q in %q", want, got)
		}
	}
	if !strings.Contains(got, "google") {
		t.Fatalf("agent help missing approved skill list: %q", got)
	}
	if !strings.Contains(got, "cf-tunnel") {
		t.Fatalf("agent help missing cf-tunnel approved skill: %q", got)
	}
}
