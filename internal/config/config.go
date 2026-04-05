package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Listen           string   `json:"listen"`
	SkillRoots       []string `json:"skill_roots"`
	AgentProfilesDir string   `json:"agent_profiles_dir"`
	GeneratedDir     string   `json:"generated_dir"`
}

func DefaultPath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "~/Private/cicy-skills/config.json"
	}
	return filepath.Join(home, "Private", "cicy-skills", "config.json")
}

func Default() Config {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "~"
	}
	privateDir := filepath.Join(home, "Private")
	return Config{
		Listen:           "127.0.0.1:7811",
		SkillRoots:       []string{filepath.Join(privateDir, "skills")},
		AgentProfilesDir: filepath.Join(privateDir, "cicy-skills", "agents"),
		GeneratedDir:     filepath.Join(privateDir, "cicy-skills", "generated"),
	}
}

func ExpandPath(path string) string {
	if path == "" {
		return path
	}
	if strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err == nil {
			return filepath.Join(home, path[2:])
		}
	}
	return path
}

func Normalize(cfg Config) Config {
	if cfg.Listen == "" {
		cfg.Listen = Default().Listen
	}
	if len(cfg.SkillRoots) == 0 {
		cfg.SkillRoots = Default().SkillRoots
	}
	if cfg.AgentProfilesDir == "" {
		cfg.AgentProfilesDir = Default().AgentProfilesDir
	}
	if cfg.GeneratedDir == "" {
		cfg.GeneratedDir = Default().GeneratedDir
	}
	for i := range cfg.SkillRoots {
		cfg.SkillRoots[i] = ExpandPath(cfg.SkillRoots[i])
	}
	cfg.AgentProfilesDir = ExpandPath(cfg.AgentProfilesDir)
	cfg.GeneratedDir = ExpandPath(cfg.GeneratedDir)
	return cfg
}

func Load(path string) (Config, error) {
	if path == "" {
		path = DefaultPath()
	}
	path = ExpandPath(path)
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return Normalize(Default()), nil
		}
		return Config{}, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, err
	}
	return Normalize(cfg), nil
}

func WriteDefault(path string, overwrite bool) error {
	if path == "" {
		path = DefaultPath()
	}
	path = ExpandPath(path)
	if !overwrite {
		if _, err := os.Stat(path); err == nil {
			return os.ErrExist
		}
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(Default(), "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0o644)
}
