package main

import (
	"encoding/json"
	"errors"
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
	case "serve":
		runServer()
	case "http-list":
		runHTTPList(args[1:])
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

func usage() {
	_, _ = fmt.Fprintln(os.Stderr, `cicy-skills

commands:
  version
  config-path
  init-config
  list
  nodes
  http-list
  serve`)
}

func fatal(err error) {
	out, _ := json.Marshal(map[string]string{"error": err.Error()})
	fmt.Fprintln(os.Stderr, string(out))
	os.Exit(1)
}
