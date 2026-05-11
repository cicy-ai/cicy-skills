package hosttools

import (
	"bufio"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type mihomeTool struct {
	stdout io.Writer
	stderr io.Writer
}

type mihomeState struct {
	PID       int    `json:"pid"`
	Binary    string `json:"binary"`
	Config    string `json:"config"`
	Log       string `json:"log"`
	StartedAt string `json:"started_at"`
}

type mihomeFlagOptions struct {
	Config string
	Binary string
	Lines  int
}

func (e *Env) runCicyMihome(args []string) error {
	return newMihomeTool(e.Stdout, e.Stderr).run(args)
}

func newMihomeTool(stdout, stderr io.Writer) *mihomeTool {
	if stdout == nil {
		stdout = io.Discard
	}
	if stderr == nil {
		stderr = io.Discard
	}
	return &mihomeTool{stdout: stdout, stderr: stderr}
}

func (t *mihomeTool) run(args []string) error {
	cmd := "help"
	if len(args) > 0 {
		cmd = strings.TrimSpace(args[0])
		args = args[1:]
	}

	switch cmd {
	case "help", "-h", "--help":
		_, _ = fmt.Fprintln(t.stdout, t.helpText())
		return nil
	case "template":
		_, _ = fmt.Fprint(t.stdout, t.defaultTemplate())
		return nil
	case "show-config":
		return t.showConfig()
	case "gen-config":
		return t.genConfig()
	case "status":
		return t.status()
	case "start":
		return t.start()
	case "stop":
		return t.stop()
	case "restart":
		if err := t.stop(); err != nil && !errors.Is(err, errMihomeNotRunning) {
			return err
		}
		return t.start()
	case "reload":
		return t.reload()
	case "logs", "log":
		opts, extra, err := parseMihomeFlags(args)
		if err != nil {
			return err
		}
		if len(extra) > 1 {
			return fmt.Errorf("usage: cicy-mihome logs [N]")
		}
		if len(extra) == 1 {
			n, convErr := strconv.Atoi(strings.TrimSpace(extra[0]))
			if convErr != nil || n <= 0 {
				return fmt.Errorf("invalid log line count: %s", extra[0])
			}
			opts.Lines = n
		}
		return t.logs(opts)
	case "install":
		_, _ = fmt.Fprintln(t.stdout, t.installGuide())
		return nil
	default:
		_, _ = fmt.Fprintln(t.stdout, t.helpText())
		return fmt.Errorf("unknown subcommand: %s", cmd)
	}
}

var errMihomeNotRunning = errors.New("cicy-mihome is not running")

func (t *mihomeTool) helpText() string {
	return `cicy-mihome - manage local mihome proxy

Usage:
  cicy-mihome help
  cicy-mihome template
  cicy-mihome gen-config
  cicy-mihome show-config
  cicy-mihome status
  cicy-mihome start
  cicy-mihome stop
  cicy-mihome restart
  cicy-mihome reload
  cicy-mihome logs [N]
  cicy-mihome install

Defaults:
  config: ~/cicy-ai/db/mihome.yaml
  controller: 127.0.0.1:19001
  mixed-port: 9001
`
}

func (t *mihomeTool) installGuide() string {
	return `Install mihome with CN GitHub mirror:
  git clone https://gh-proxy.com/https://github.com/cicy-ai/mihome.git
  cd mihome
  go build
`
}

func (t *mihomeTool) stateDir() string {
	return filepath.Join(userHomeDir(), ".local", "state", "cicy-skills", "mihome")
}

func (t *mihomeTool) pidFile() string {
	return filepath.Join(t.stateDir(), "pid")
}

func (t *mihomeTool) stateFile() string {
	return filepath.Join(t.stateDir(), "state.json")
}

func (t *mihomeTool) logFile() string {
	return filepath.Join(t.stateDir(), "mihome.log")
}

func (t *mihomeTool) configPath() string {
	return filepath.Join(userHomeDir(), "cicy-ai", "db", "mihome.yaml")
}

func (t *mihomeTool) binaryCandidates() []string {
	home := userHomeDir()
	return []string{
		strings.TrimSpace(os.Getenv("MIHOME_BIN")),
		"/tmp/mihomo-test",
		filepath.Join(home, ".local", "bin", "mihomo"),
		filepath.Join(home, ".local", "bin", "mihomo-test"),
		"mihomo",
		"mihomo-test",
	}
}

func (t *mihomeTool) resolveBinary() (string, error) {
	for _, candidate := range t.binaryCandidates() {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}
		if strings.Contains(candidate, string(os.PathSeparator)) {
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				return candidate, nil
			}
			continue
		}
		if path, err := exec.LookPath(candidate); err == nil {
			return path, nil
		}
	}
	return "", fmt.Errorf("mihome binary not found; set MIHOME_BIN or build mihome first")
}

func parseMihomeFlags(args []string) (mihomeFlagOptions, []string, error) {
	opts := mihomeFlagOptions{Lines: 80}
	rest := make([]string, 0, len(args))
	for i := 0; i < len(args); i++ {
		arg := strings.TrimSpace(args[i])
		switch {
		case arg == "--config" && i+1 < len(args):
			opts.Config = strings.TrimSpace(args[i+1])
			i++
		case strings.HasPrefix(arg, "--config="):
			opts.Config = strings.TrimSpace(strings.TrimPrefix(arg, "--config="))
		case arg == "--bin" && i+1 < len(args):
			opts.Binary = strings.TrimSpace(args[i+1])
			i++
		case strings.HasPrefix(arg, "--bin="):
			opts.Binary = strings.TrimSpace(strings.TrimPrefix(arg, "--bin="))
		default:
			rest = append(rest, arg)
		}
	}
	return opts, rest, nil
}

func (t *mihomeTool) defaultTemplate() string {
	password := randomAlphaNum(16)
	return fmt.Sprintf("mixed-port: 9001\nallow-lan: true\nbind: 0.0.0.0\nmode: rule\nlog-level: debug\n\nexternal-controller: 127.0.0.1:18009\n\nauthentication:\n  - \"w-10001:%s\"\n\nproxies:\n  - name: \"proxy-a\"\n    type: socks5\n    server: 127.0.0.1\n    port: 1084\n\nrules:\n  - IN-USER,w-10001,proxy-a\n  - MATCH,REJECT\n", password)
}

func (t *mihomeTool) genConfig() error {
	path := t.configPath()
	if _, err := os.Stat(path); err == nil {
		return fmt.Errorf("config already exists: %s", path)
	} else if !os.IsNotExist(err) {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(path, []byte(t.defaultTemplate()), 0o644); err != nil {
		return err
	}
	_, _ = fmt.Fprintln(t.stdout, path)
	return nil
}

func (t *mihomeTool) showConfig() error {
	data, err := os.ReadFile(t.configPath())
	if err != nil {
		return err
	}
	_, _ = t.stdout.Write(data)
	if len(data) == 0 || data[len(data)-1] != '\n' {
		_, _ = fmt.Fprintln(t.stdout)
	}
	return nil
}

func (t *mihomeTool) start() error {
	binary, err := t.resolveBinary()
	if err != nil {
		return err
	}
	configPath := t.configPath()
	if _, err := os.Stat(configPath); err != nil {
		return fmt.Errorf("config not found: %s", configPath)
	}
	if err := os.MkdirAll(t.stateDir(), 0o755); err != nil {
		return err
	}
	logPath := t.logFile()
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return err
	}
	defer logFile.Close()
	cmd := exec.Command(binary, "-d", filepath.Join(userHomeDir(), "cicy-ai"), "-f", configPath)
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.Stdin = nil
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	if err := cmd.Start(); err != nil {
		return err
	}
	state := mihomeState{PID: cmd.Process.Pid, Binary: binary, Config: configPath, Log: logPath, StartedAt: time.Now().UTC().Format(time.RFC3339)}
	if err := t.writeState(state); err != nil {
		return err
	}
	_, _ = fmt.Fprintln(t.stdout, "started")
	return nil
}

func (t *mihomeTool) stop() error {
	state, err := t.readState()
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return errMihomeNotRunning
		}
		return err
	}
	process, err := os.FindProcess(state.PID)
	if err == nil {
		_ = process.Signal(syscall.SIGTERM)
	}
	_ = os.Remove(t.stateFile())
	_, _ = fmt.Fprintln(t.stdout, "stopped")
	return nil
}

func (t *mihomeTool) status() error {
	state, err := t.readState()
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			_, _ = fmt.Fprintln(t.stdout, "status: stopped")
			return nil
		}
		return err
	}
	_, controller := parseMihomePortsFromConfig(state.Config)
	if strings.TrimSpace(controller) == "" {
		controller = "127.0.0.1:19001"
	}
	controllerURL := "http://" + controller + "/version"
	version := ""
	if resp, err := http.Get(controllerURL); err == nil {
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		version = strings.TrimSpace(string(body))
	}
	_, _ = fmt.Fprintf(t.stdout, "status: running\npid: %d\nbinary: %s\nconfig: %s\nlog: %s\nstarted_at: %s\ncontroller: %s\nversion: %s\n", state.PID, state.Binary, state.Config, state.Log, state.StartedAt, controllerURL, version)
	return nil
}

func (t *mihomeTool) reload() error {
	state, err := t.readState()
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return errMihomeNotRunning
		}
		return err
	}
	configPath := state.Config
	if strings.TrimSpace(configPath) == "" {
		configPath = t.configPath()
	}
	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}
	_, controller := parseMihomePortsFromConfig(configPath)
	if strings.TrimSpace(controller) == "" {
		controller = "127.0.0.1:19001"
	}
	endpoint := "http://" + controller + "/configs?force=true"
	payload := map[string]any{
		"path":    configPath,
		"payload": string(data),
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPut, endpoint, strings.NewReader(string(body)))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("reload failed: %s", strings.TrimSpace(string(respBody)))
	}
	_, _ = fmt.Fprintln(t.stdout, "reloaded")
	return nil
}

func (t *mihomeTool) logs(opts mihomeFlagOptions) error {
	path := t.logFile()
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	lines := []string{}
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
		if len(lines) > opts.Lines {
			lines = lines[1:]
		}
	}
	for _, line := range lines {
		_, _ = fmt.Fprintln(t.stdout, line)
	}
	return scanner.Err()
}

func (t *mihomeTool) readState() (mihomeState, error) {
	var state mihomeState
	data, err := os.ReadFile(t.stateFile())
	if err != nil {
		return state, err
	}
	if err := json.Unmarshal(data, &state); err != nil {
		return state, err
	}
	return state, nil
}

func (t *mihomeTool) writeState(state mihomeState) error {
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(t.stateFile(), data, 0o644)
}

func parseMihomePortsFromConfig(path string) (mixedPort int, controller string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, ""
	}
	text := string(data)
	mixedRe := regexp.MustCompile(`(?m)^mixed-port:\s*(\d+)\s*$`)
	controllerRe := regexp.MustCompile(`(?m)^external-controller:\s*([^\s]+)\s*$`)
	if m := mixedRe.FindStringSubmatch(text); len(m) == 2 {
		mixedPort, _ = strconv.Atoi(m[1])
	}
	if m := controllerRe.FindStringSubmatch(text); len(m) == 2 {
		controller = strings.TrimSpace(m[1])
	}
	return mixedPort, controller
}

func randomAlphaNum(n int) string {
	if n <= 0 {
		return ""
	}
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	buf := make([]byte, n)
	raw := make([]byte, n)
	if _, err := rand.Read(raw); err != nil {
		for i := range buf {
			buf[i] = alphabet[i%len(alphabet)]
		}
		return string(buf)
	}
	for i := range buf {
		buf[i] = alphabet[int(raw[i])%len(alphabet)]
	}
	return string(buf)
}
