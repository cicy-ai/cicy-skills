package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/cicy-ai/cicy-skills/internal/config"
	"github.com/cicy-ai/cicy-skills/internal/skills"
	"github.com/cicy-ai/cicy-skills/internal/version"
)

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		usage()
		return
	}

	switch args[0] {
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
	case "serve":
		runServer()
	case "http-list":
		cfg, err := config.Load(os.Getenv("CICY_SKILLS_CONFIG"))
		if err != nil {
			fatal(err)
		}
		resp, err := http.Get("http://" + cfg.Listen + "/v1/skills")
		if err != nil {
			fatal(err)
		}
		defer resp.Body.Close()
		_, _ = io.Copy(os.Stdout, resp.Body)
	default:
		if strings.HasPrefix(args[0], "-") {
			usage()
			return
		}
		usage()
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

func usage() {
	_, _ = fmt.Fprintln(os.Stderr, `cicy-skills

commands:
  version
  config-path
  init-config
  list
  http-list
  serve`)
}

func fatal(err error) {
	out, _ := json.Marshal(map[string]string{"error": err.Error()})
	fmt.Fprintln(os.Stderr, string(out))
	os.Exit(1)
}
