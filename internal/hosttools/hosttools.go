package hosttools

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

const (
	defaultAPIBase = "http://127.0.0.1:8008"
	defaultRepo    = "cicy-dev/Private"
)

type Env struct {
	Global map[string]any
	Token  string
	API    string
	WS     string
	HTTP   *http.Client
	Stdout io.Writer
	Stderr io.Writer
}

func Run(invoked string, args []string, stdout, stderr io.Writer) int {
	env, err := newEnv(stdout, stderr)
	if err != nil {
		fmt.Fprintln(stderr, err)
		return 1
	}

	cmd := filepath.Base(strings.TrimSpace(invoked))
	if cmd == "cicy-hosttools" {
		if len(args) == 0 {
			printAvailable(stderr)
			return 1
		}
		cmd = args[0]
		args = args[1:]
	}

	switch cmd {
	case "gpt":
		err = env.runSimpleAI(args, "/api/ai/chat", "Usage: gpt <question>")
	case "eng":
		err = env.runSimpleAI(args, "/api/ai/correct", "Usage: eng <text>")
	case "gpt-chat":
		err = env.runGPTChat(args)
	case "tg":
		err = env.runTG(args)
	case "tm":
		err = env.runTM(args)
	case "agent-page-ping":
		err = env.runDesktopPing("ping", "pong", "✅ 收到 pong！连通成功", args)
	case "ipc-ping":
		err = env.runIPCPing(args)
	case "webpage":
		err = env.runWebpage(args)
	case "webpage-ping":
		err = env.runWebpage([]string{"ping"})
	case "gemini-ask":
		err = env.runGeminiAsk(args)
	case "gemini-vision":
		err = env.runGeminiVision(args)
	case "mysql-exec":
		err = env.runMySQLExec(args)
	case "todo":
		err = env.runTodo(args)
	case "cf-tunnel", "cf-tunnel-py", "cf-tunnel.py":
		err = env.runCFTunnel(args)
	case "cping":
		err = env.runCPing(args)
	case "globalApiToken", "global-api-token", "global-api-token.py":
		err = env.runGlobalAPIToken(args)
	default:
		fmt.Fprintf(stderr, "unsupported host tool: %s\n", cmd)
		printAvailable(stderr)
		return 1
	}

	if err != nil {
		fmt.Fprintln(stderr, err)
		return 1
	}
	return 0
}

func newEnv(stdout, stderr io.Writer) (*Env, error) {
	global, err := loadGlobalJSON()
	if err != nil {
		return nil, err
	}
	api := strings.TrimSpace(os.Getenv("API_BASE"))
	if api == "" {
		port := strings.TrimSpace(os.Getenv("API_PORT"))
		if port == "" {
			port = "8008"
		}
		api = "http://127.0.0.1:" + port
	}
	ws := "ws" + strings.TrimPrefix(api, "http")
	return &Env{
		Global: global,
		Token:  strings.TrimSpace(anyString(global["api_token"])),
		API:    strings.TrimRight(api, "/"),
		WS:     strings.TrimRight(ws, "/"),
		HTTP:   &http.Client{Timeout: 60 * time.Second},
		Stdout: stdout,
		Stderr: stderr,
	}, nil
}

func loadGlobalJSON() (map[string]any, error) {
	path := globalJSONPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func globalJSONPath() string {
	return filepath.Join(userHomeDir(), "global.json")
}

func userHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "~"
	}
	return home
}

func anyString(v any) string {
	switch x := v.(type) {
	case string:
		return x
	default:
		return ""
	}
}

func printAvailable(w io.Writer) {
	_, _ = fmt.Fprintln(w, "available commands: gpt, gpt-chat, eng, tg, tm, agent-page-ping, ipc-ping, webpage, webpage-ping, gemini-ask, gemini-vision, mysql-exec, todo, cf-tunnel, cping, globalApiToken")
}

func (e *Env) apiRequest(ctx context.Context, method, path string, payload any) ([]byte, error) {
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(data)
	}
	req, err := http.NewRequestWithContext(ctx, method, e.API+path, body)
	if err != nil {
		return nil, err
	}
	if e.Token != "" {
		req.Header.Set("Authorization", "Bearer "+e.Token)
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := e.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= http.StatusBadRequest {
		return nil, fmt.Errorf("api error: %s", strings.TrimSpace(string(data)))
	}
	return data, nil
}

func (e *Env) wsConnect(pane string) (*websocket.Conn, error) {
	u := fmt.Sprintf("%s/api/chat/ws?pane=%s&token=%s", e.WS, url.QueryEscape(pane), url.QueryEscape(e.Token))
	conn, _, err := websocket.DefaultDialer.Dial(u, nil)
	return conn, err
}

func currentPane() string {
	re := regexp.MustCompile(`(w-\d+)`)
	if match := re.FindStringSubmatch(mustGetwd()); len(match) == 2 {
		return match[1]
	}
	return "w-10001"
}

func mustGetwd() string {
	wd, err := os.Getwd()
	if err != nil {
		return ""
	}
	return wd
}

func (e *Env) waitForMessage(conn *websocket.Conn, timeout time.Duration, match func(map[string]any) bool) (map[string]any, error) {
	deadline := time.Now().Add(timeout)
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	for time.Now().Before(deadline) {
		var msg map[string]any
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
				break
			}
			if ne, ok := err.(net.Error); ok && ne.Timeout() {
				_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
				continue
			}
			_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
			continue
		}
		if match(msg) {
			return msg, nil
		}
	}
	return nil, fmt.Errorf("timeout waiting for response")
}

func randomID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano()/1e6)
}

func newGlobalAPIToken() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return fmt.Sprintf("cicy_%x", buf), nil
}

func asMap(v any) map[string]any {
	m, _ := v.(map[string]any)
	return m
}

func (e *Env) runSimpleAI(args []string, endpoint, usage string) error {
	if len(args) == 0 {
		return errors.New(usage)
	}
	payload := map[string]any{"text": strings.Join(args, " ")}
	data, err := e.apiRequest(context.Background(), http.MethodPost, endpoint, payload)
	if err != nil {
		return err
	}
	var out map[string]any
	if err := json.Unmarshal(data, &out); err == nil {
		if result := strings.TrimSpace(anyString(out["result"])); result != "" {
			_, _ = fmt.Fprintln(e.Stdout, result)
			return nil
		}
	}
	_, _ = e.Stdout.Write(data)
	_, _ = fmt.Fprintln(e.Stdout)
	return nil
}

func (e *Env) runGPTChat(args []string) error {
	hist := filepath.Join(userHomeDir(), "Private", "data", "gpt-chat-history.json")
	sysPath := filepath.Join(userHomeDir(), "Private", "data", "gpt-chat-system.txt")
	if len(args) == 0 {
		return errors.New("Usage: gpt-chat <message>")
	}
	switch args[0] {
	case "--clear":
		_ = os.Remove(hist)
		_, _ = fmt.Fprintln(e.Stdout, "History cleared.")
		return nil
	case "--system":
		if len(args) < 2 {
			return errors.New("Usage: gpt-chat --system <text>")
		}
		if err := os.MkdirAll(filepath.Dir(sysPath), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(sysPath, []byte(strings.Join(args[1:], " ")+"\n"), 0o644); err != nil {
			return err
		}
		_, _ = fmt.Fprintln(e.Stdout, "System prompt set.")
		return nil
	case "--show-system":
		data, err := os.ReadFile(sysPath)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				_, _ = fmt.Fprintln(e.Stdout, "(none)")
				return nil
			}
			return err
		}
		_, _ = e.Stdout.Write(data)
		if len(data) == 0 || data[len(data)-1] != '\n' {
			_, _ = fmt.Fprintln(e.Stdout)
		}
		return nil
	}

	type message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	var msgs []message
	if data, err := os.ReadFile(sysPath); err == nil {
		text := strings.TrimSpace(string(data))
		if text != "" {
			msgs = append(msgs, message{Role: "system", Content: text})
		}
	}
	if data, err := os.ReadFile(hist); err == nil {
		var histMsgs []message
		if json.Unmarshal(data, &histMsgs) == nil {
			msgs = append(msgs, histMsgs...)
		}
	}
	userText := strings.Join(args, " ")
	msgs = append(msgs, message{Role: "user", Content: userText})

	data, err := e.apiRequest(context.Background(), http.MethodPost, "/api/ai/chat", map[string]any{"messages": msgs})
	if err != nil {
		return err
	}
	var out map[string]any
	if err := json.Unmarshal(data, &out); err != nil {
		return err
	}
	result := strings.TrimSpace(anyString(out["result"]))
	_, _ = fmt.Fprintln(e.Stdout, result)

	msgs = append(msgs, message{Role: "assistant", Content: result})
	persist := msgs
	if len(persist) > 0 && persist[0].Role == "system" {
		persist = persist[1:]
	}
	if err := os.MkdirAll(filepath.Dir(hist), 0o755); err != nil {
		return err
	}
	buf, err := json.MarshalIndent(persist, "", "  ")
	if err != nil {
		return err
	}
	buf = append(buf, '\n')
	return os.WriteFile(hist, buf, 0o644)
}

func (e *Env) runTG(args []string) error {
	if len(args) == 0 {
		return errors.New("Usage: tg <send|photo> [args]")
	}
	switch args[0] {
	case "send":
		if len(args) < 2 {
			return errors.New("Usage: tg send <message>")
		}
		data, err := e.apiRequest(context.Background(), http.MethodPost, "/api/tg/send", map[string]any{"text": strings.Join(args[1:], " ")})
		if err != nil {
			return err
		}
		return printTelegramResult(e.Stdout, data)
	case "photo":
		if len(args) < 2 {
			return errors.New("Usage: tg photo <url> [caption]")
		}
		caption := ""
		if len(args) > 2 {
			caption = args[2]
		}
		data, err := e.apiRequest(context.Background(), http.MethodPost, "/api/tg/photo", map[string]any{"photo": args[1], "caption": caption})
		if err != nil {
			return err
		}
		return printTelegramResult(e.Stdout, data)
	default:
		return errors.New("Usage: tg <send|photo> [args]")
	}
}

func (e *Env) runGlobalAPIToken(args []string) error {
	cmd := "show"
	if len(args) > 0 {
		cmd = strings.TrimSpace(args[0])
	}

	switch cmd {
	case "show":
		token := strings.TrimSpace(anyString(e.Global["api_token"]))
		if token == "" {
			return fmt.Errorf("api_token is empty in %s", globalJSONPath())
		}
		_, _ = fmt.Fprintln(e.Stdout, token)
		return nil
	case "refresh":
		global, err := loadGlobalJSON()
		if err != nil {
			return err
		}
		token, err := newGlobalAPIToken()
		if err != nil {
			return err
		}
		global["api_token"] = token
		data, err := json.MarshalIndent(global, "", "  ")
		if err != nil {
			return err
		}
		data = append(data, '\n')
		if err := os.WriteFile(globalJSONPath(), data, 0o644); err != nil {
			return err
		}
		e.Global = global
		e.Token = token
		_, _ = fmt.Fprintln(e.Stdout, token)
		return nil
	default:
		return errors.New("Usage: globalApiToken <show|refresh>")
	}
}

func printTelegramResult(w io.Writer, data []byte) error {
	var out map[string]any
	if err := json.Unmarshal(data, &out); err != nil {
		return err
	}
	if ok, _ := out["ok"].(bool); ok {
		_, _ = fmt.Fprintln(w, "✓ Sent.")
		return nil
	}
	_, _ = fmt.Fprintf(w, "✗ %v\n", out["description"])
	return nil
}

func (e *Env) runTM(args []string) error {
	cmd := "help"
	if len(args) > 0 {
		cmd = args[0]
	}
	switch cmd {
	case "ls":
		data, err := e.apiRequest(context.Background(), http.MethodGet, "/api/tmux/panes", nil)
		if err != nil {
			return err
		}
		var out struct {
			Panes []map[string]any `json:"panes"`
		}
		if err := json.Unmarshal(data, &out); err != nil {
			return err
		}
		for _, pane := range out.Panes {
			_, _ = fmt.Fprintf(e.Stdout, "%v\t%v\t%v\n", pane["pane_id"], pane["role"], pane["title"])
		}
	case "status":
		path := "/api/tmux/status"
		if len(args) > 1 {
			path += "?pane=" + url.QueryEscape(args[1])
		}
		return e.copyAPI(http.MethodGet, path, nil)
	case "tree":
		return e.copyAPI(http.MethodGet, "/api/tmux/tree", nil)
	case "windows":
		return e.copyAPI(http.MethodGet, "/api/tmux/windows", nil)
	case "capture":
		if len(args) < 2 {
			return errors.New("Usage: tm capture <pane>")
		}
		return e.copyAPI(http.MethodPost, "/api/tmux/capture_pane", map[string]any{"pane_id": args[1]})
	case "msg":
		if len(args) < 3 {
			return errors.New("Usage: tm msg <pane> <text>")
		}
		return e.copyAPI(http.MethodPost, "/api/tmux/send", map[string]any{"pane_id": args[1], "text": strings.Join(args[2:], " ")})
	case "msg_wait":
		if len(args) < 3 {
			return errors.New("Usage: tm msg_wait <pane> <text> [timeout] [prompt_type]")
		}
		timeout := 60
		if len(args) > 3 {
			timeout, _ = strconv.Atoi(args[3])
		}
		promptType := "bash"
		if len(args) > 4 {
			promptType = args[4]
		}
		return e.copyAPI(http.MethodPost, "/api/tmux/send_wait", map[string]any{"pane_id": args[1], "text": args[2], "timeout": timeout, "prompt_type": promptType})
	case "send-keys":
		if len(args) < 3 {
			return errors.New("Usage: tm send-keys <pane> <keys>")
		}
		return e.copyAPI(http.MethodPost, "/api/tmux/send-keys", map[string]any{"pane_id": args[1], "keys": strings.Join(args[2:], " ")})
	case "create":
		if len(args) < 2 {
			return errors.New("Usage: tm create <name>")
		}
		return e.copyAPI(http.MethodPost, "/api/tmux/create", map[string]any{"name": args[1]})
	case "restart":
		return e.copyAPI(http.MethodPost, "/api/tmux/restart_all", map[string]any{})
	case "clear":
		if len(args) < 2 {
			return errors.New("Usage: tm clear <pane>")
		}
		return e.copyAPI(http.MethodPost, "/api/tmux/clear", map[string]any{"pane": args[1]})
	default:
		_, _ = fmt.Fprintln(e.Stdout, "Usage: tm <command> [args]\n  ls\n  status [pane]\n  tree\n  windows\n  capture <pane>\n  msg <pane> <text>\n  msg_wait <pane> <text> [timeout] [prompt_type]\n  send-keys <pane> <keys>\n  create <name>\n  restart\n  clear <pane>")
	}
	return nil
}

func (e *Env) copyAPI(method, path string, payload any) error {
	data, err := e.apiRequest(context.Background(), method, path, payload)
	if err != nil {
		return err
	}
	_, _ = e.Stdout.Write(data)
	if len(data) == 0 || data[len(data)-1] != '\n' {
		_, _ = fmt.Fprintln(e.Stdout)
	}
	return nil
}

func (e *Env) runDesktopPing(kind, expectType, successText string, args []string) error {
	pane := currentPane()
	if len(args) > 0 {
		pane = args[0]
	}
	rid := randomID(kind)
	conn, err := e.wsConnect(pane)
	if err != nil {
		return err
	}
	defer conn.Close()
	_, err = e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
		"pane": pane,
		"type": "desktop_event",
		"data": map[string]any{"type": kind, "requestId": rid},
	})
	if err != nil {
		return err
	}
	_, _ = fmt.Fprintf(e.Stdout, "✅ 发送 %s (%s)\n", kind, rid)
	_, err = e.waitForMessage(conn, 15*time.Second, func(m map[string]any) bool {
		return anyString(m["type"]) == expectType && anyString(asMap(m["data"])["requestId"]) == rid
	})
	if err != nil {
		return err
	}
	_, _ = fmt.Fprintln(e.Stdout, successText)
	return nil
}

func (e *Env) runIPCPing(args []string) error {
	pane := currentPane()
	if len(args) > 0 {
		pane = args[0]
	}
	rid := randomID("ipc-ping")
	conn, err := e.wsConnect(pane)
	if err != nil {
		return err
	}
	defer conn.Close()
	_, err = e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
		"pane": pane,
		"type": "desktop_event",
		"data": map[string]any{"type": "ipc_ping", "requestId": rid},
	})
	if err != nil {
		return err
	}
	_, _ = fmt.Fprintf(e.Stdout, "✅ 发送 ipc_ping (%s)\n", rid)
	msg, err := e.waitForMessage(conn, 15*time.Second, func(m map[string]any) bool {
		return anyString(m["type"]) == "ipc_pong" && anyString(asMap(m["data"])["requestId"]) == rid
	})
	if err != nil {
		return err
	}
	_, _ = fmt.Fprintln(e.Stdout, "✅ 收到 ipc_pong！Electron 连通成功")
	if result := strings.TrimSpace(anyString(asMap(msg["data"])["result"])); result != "" {
		_, _ = fmt.Fprintf(e.Stdout, "   Electron 返回: %s\n", result)
	}
	return nil
}

func (e *Env) runWebpage(args []string) error {
	cmd := "help"
	if len(args) > 0 {
		cmd = args[0]
		args = args[1:]
	}
	switch cmd {
	case "ping":
		pane := currentPane()
		if len(args) > 0 {
			pane = args[0]
		}
		rid := randomID("webpage-ping")
		conn, err := e.wsConnect(pane)
		if err != nil {
			return err
		}
		defer conn.Close()
		_, err = e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
			"pane": pane,
			"type": "webpage_ping",
			"data": map[string]any{"requestId": rid},
		})
		if err != nil {
			return err
		}
		_, _ = fmt.Fprintf(e.Stdout, "✅ 发送 webpage_ping → pane=%s\n", pane)
		msg, err := e.waitForMessage(conn, 15*time.Second, func(m map[string]any) bool {
			return anyString(m["type"]) == "webpage_pong" && anyString(asMap(m["data"])["requestId"]) == rid
		})
		if err != nil {
			return err
		}
		version := anyString(asMap(msg["data"])["version"])
		if version == "" {
			version = "unknown"
		}
		_, _ = fmt.Fprintf(e.Stdout, "✅ 网页客户端在线 (v%s)\n", version)
		return nil
	case "ipc-ping":
		return e.runIPCPing(args)
	case "exec-js":
		if len(args) < 1 {
			return errors.New("Usage: webpage exec-js '<js代码>' [pane]")
		}
		pane := currentPane()
		if len(args) > 1 {
			pane = args[1]
		}
		rid := randomID("exec")
		conn, err := e.wsConnect(pane)
		if err != nil {
			return err
		}
		defer conn.Close()
		_, err = e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
			"pane": pane,
			"type": "exec_js",
			"data": map[string]any{"code": args[0], "requestId": rid},
		})
		if err != nil {
			return err
		}
		msg, err := e.waitForMessage(conn, 20*time.Second, func(m map[string]any) bool {
			return anyString(m["type"]) == "exec_js_result" && anyString(asMap(m["data"])["requestId"]) == rid
		})
		if err != nil {
			return err
		}
		data := asMap(msg["data"])
		if errText := anyString(data["error"]); errText != "" {
			return errors.New(errText)
		}
		_, _ = fmt.Fprintln(e.Stdout, data["result"])
		return nil
	case "send":
		if len(args) < 2 {
			return errors.New("Usage: webpage send <type> <data_json> [pane]")
		}
		var payload any
		if err := json.Unmarshal([]byte(args[1]), &payload); err != nil {
			return err
		}
		pane := currentPane()
		if len(args) > 2 {
			pane = args[2]
		}
		_, err := e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
			"pane": pane,
			"type": args[0],
			"data": payload,
		})
		if err != nil {
			return err
		}
		_, _ = fmt.Fprintf(e.Stdout, "✅ 发送 %s → pane=%s\n", args[0], pane)
		return nil
	case "clients":
		return e.copyAPI(http.MethodGet, "/api/chat/clients", nil)
	default:
		_, _ = fmt.Fprintln(e.Stdout, "webpage - CiCy 网页客户端控制工具\n\n命令:\n  ping\n  ipc-ping\n  exec-js\n  send\n  clients\n\n用法: webpage <命令> [参数...]")
		return nil
	}
}

func (e *Env) runGeminiAsk(args []string) error {
	if len(args) < 1 {
		return errors.New("Usage: gemini-ask <prompt> [win_id]")
	}
	winID := 4
	if len(args) > 1 {
		winID, _ = strconv.Atoi(args[1])
	}
	pane := currentPane()
	rid := randomID("gemini")
	conn, err := e.wsConnect(pane)
	if err != nil {
		return err
	}
	defer conn.Close()
	go func() {
		time.Sleep(500 * time.Millisecond)
		_, _ = e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
			"pane": pane,
			"type": "desktop_event",
			"data": map[string]any{"type": "gemini_ask", "prompt": args[0], "win_id": winID, "requestId": rid},
		})
	}()
	msg, err := e.waitForMessage(conn, 60*time.Second, func(m map[string]any) bool {
		return anyString(m["type"]) == "gemini_ask_result" && anyString(asMap(m["data"])["requestId"]) == rid
	})
	if err != nil {
		return err
	}
	data := asMap(msg["data"])
	if errText := anyString(data["error"]); errText != "" {
		return errors.New(errText)
	}
	_, _ = fmt.Fprintln(e.Stdout, data["result"])
	return nil
}

func (e *Env) runGeminiVision(args []string) error {
	prompt := "描述这个截图的内容"
	if len(args) > 0 {
		prompt = args[0]
	}
	winID := 4
	srcWinID := 1
	if len(args) > 1 {
		winID, _ = strconv.Atoi(args[1])
	}
	if len(args) > 2 {
		srcWinID, _ = strconv.Atoi(args[2])
	}
	pane := currentPane()
	rid := randomID("vision")
	conn, err := e.wsConnect(pane)
	if err != nil {
		return err
	}
	defer conn.Close()
	go func() {
		time.Sleep(500 * time.Millisecond)
		_, _ = e.apiRequest(context.Background(), http.MethodPost, "/api/chat/push", map[string]any{
			"pane": pane,
			"type": "desktop_event",
			"data": map[string]any{"type": "gemini_vision_request", "prompt": prompt, "win_id": winID, "src_win_id": srcWinID, "requestId": rid},
		})
	}()
	msg, err := e.waitForMessage(conn, 60*time.Second, func(m map[string]any) bool {
		return anyString(m["type"]) == "gemini_vision_result" && anyString(asMap(m["data"])["requestId"]) == rid
	})
	if err != nil {
		return err
	}
	data := asMap(msg["data"])
	if errText := anyString(data["error"]); errText != "" {
		return errors.New(errText)
	}
	_, _ = fmt.Fprintln(e.Stdout, data["result"])
	return nil
}

func (e *Env) runMySQLExec(args []string) error {
	if len(args) < 1 {
		return errors.New("Usage: mysql-exec \"SQL\" [database]")
	}
	db := "cicy_code"
	if len(args) > 1 {
		db = args[1]
	}
	pass := readEnvValue(filepath.Join(userHomeDir(), "projects", "cicy-code", ".env"), "MYSQL_ROOT_PASSWORD")
	cmd := exec.Command("docker", "exec", "-i", "cicy-mysql", "sh", "-c", fmt.Sprintf("exec mysql -u root -p'%s' %s -e %q", pass, db, args[0]))
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s", strings.TrimSpace(string(out)))
	}
	lines := filterLines(string(out), func(line string) bool {
		return !strings.Contains(line, "Warning")
	})
	_, _ = fmt.Fprint(e.Stdout, lines)
	return nil
}

func readEnvValue(path, key string) string {
	file, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, key+"=") {
			return strings.TrimPrefix(line, key+"=")
		}
	}
	return ""
}

func envOr(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func filterLines(s string, keep func(string) bool) string {
	var out []string
	for _, line := range strings.Split(s, "\n") {
		if keep(line) {
			out = append(out, line)
		}
	}
	return strings.Join(out, "\n")
}

func (e *Env) runTodo(args []string) error {
	if len(args) == 0 {
		return e.runExternal("gh", "issue", "list", "--repo", defaultRepo)
	}
	switch args[0] {
	case "feat", "fix", "todo", "add":
		label := args[0]
		if label == "add" {
			label = "todo"
		}
		title, assign := parseTodoArgs(args[1:])
		if title == "" {
			return errors.New("todo title is required")
		}
		out, err := exec.Command("gh", "issue", "create", "--repo", defaultRepo, "--title", title, "--label", label, "--body", bodyOrAssign(assign)).CombinedOutput()
		if err != nil {
			return fmt.Errorf("%s", strings.TrimSpace(string(out)))
		}
		url := strings.TrimSpace(string(out))
		_, _ = fmt.Fprintln(e.Stdout, url)
		_, _ = exec.Command("gh", "project", "item-add", "4", "--owner", "cicy-dev", "--url", url).CombinedOutput()
		return nil
	case "done":
		if len(args) < 2 {
			return errors.New("Usage: todo done <number>")
		}
		return e.runExternal("gh", "issue", "close", args[1], "--repo", defaultRepo)
	case "view":
		if len(args) < 2 {
			return errors.New("Usage: todo view <number>")
		}
		return e.runExternal("gh", "issue", "view", args[1], "--repo", defaultRepo)
	case "url":
		_, _ = fmt.Fprintln(e.Stdout, "https://github.com/users/cicy-dev/projects/4")
		return nil
	case "-h", "--help", "help":
		_, _ = fmt.Fprintln(e.Stdout, "Usage: todo [command] [args]\n\nCommands:\n  (none)                        List all open todos\n  feat <title> [--assign <w>]   Add a feature todo\n  fix  <title> [--assign <w>]   Add a fix todo\n  add  <title> [--assign <w>]   Add a general todo\n  done <number>                 Close/complete a todo\n  view <number>                 View a todo\n  url                           Show project board URL")
		return nil
	default:
		return e.runExternal("gh", "issue", "list", "--repo", defaultRepo)
	}
}

func parseTodoArgs(args []string) (title, assign string) {
	for i := 0; i < len(args); i++ {
		if args[i] == "--assign" && i+1 < len(args) {
			assign = args[i+1]
			i++
			continue
		}
		if title == "" {
			title = args[i]
		} else {
			title += " " + args[i]
		}
	}
	return strings.TrimSpace(title), strings.TrimSpace(assign)
}

func bodyOrAssign(assign string) string {
	if assign == "" {
		return ""
	}
	return "assigned to: " + assign
}

func (e *Env) runExternal(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	out, err := cmd.CombinedOutput()
	if len(out) > 0 {
		_, _ = e.Stdout.Write(out)
		if out[len(out)-1] != '\n' {
			_, _ = fmt.Fprintln(e.Stdout)
		}
	}
	if err != nil {
		return fmt.Errorf("%s", strings.TrimSpace(string(out)))
	}
	return nil
}

func (e *Env) runCFTunnel(args []string) error {
	if len(args) == 0 || args[0] == "help" || args[0] == "-h" || args[0] == "--help" {
		_, _ = fmt.Fprintln(e.Stdout, cfTunnelUsage())
		return nil
	}
	cfEnv := envOr("CF_ENV", "prod")
	cfRoot, _ := e.Global["cf"].(map[string]any)
	cfg, _ := cfRoot[cfEnv].(map[string]any)
	if len(cfg) == 0 {
		return fmt.Errorf("missing cf.%s config in ~/global.json", cfEnv)
	}
	token := strings.TrimSpace(anyString(cfg["api_token"]))
	accountID := strings.TrimSpace(anyString(cfg["account_id"]))
	tunnelID := strings.TrimSpace(anyString(cfg["tunnel_id"]))
	domain := strings.TrimSpace(anyString(cfg["domain"]))
	zoneID := strings.TrimSpace(anyString(cfg["zone_id"]))
	if token == "" || accountID == "" || tunnelID == "" || domain == "" || zoneID == "" {
		return errors.New("incomplete Cloudflare tunnel config")
	}

	cf := &cfTunnel{
		token:       token,
		accountID:   accountID,
		tunnelID:    tunnelID,
		tunnelCNAME: tunnelID + ".cfargotunnel.com",
		domain:      domain,
		zoneID:      zoneID,
		http:        e.HTTP,
		stdout:      e.Stdout,
	}
	switch args[0] {
	case "list":
		return cf.list()
	case "add":
		if len(args) < 2 {
			return errors.New("Usage: cf-tunnel add <port> [port2 ...]")
		}
		return cf.add(parsePorts(args[1:]))
	case "del":
		if len(args) < 2 {
			return errors.New("Usage: cf-tunnel del <port> [port2 ...]")
		}
		return cf.del(parsePorts(args[1:]))
	default:
		return fmt.Errorf("unknown cf-tunnel command: %s", args[0])
	}
}

func cfTunnelUsage() string {
	return `Usage: cf-tunnel <list|add|del> [ports...]

Commands:
  list                      List current tunnel routes and local port status
  add <port> [port2 ...]    Add one or more routes and DNS records
  del <port> [port2 ...]    Delete one or more routes and DNS records

Environment:
  CF_ENV=prod|dev           Choose the Cloudflare config from ~/global.json`
}

func parsePorts(args []string) []int {
	var ports []int
	for _, arg := range args {
		if n, err := strconv.Atoi(strings.TrimSpace(arg)); err == nil {
			ports = append(ports, n)
		}
	}
	return ports
}

type cfTunnel struct {
	token       string
	accountID   string
	tunnelID    string
	tunnelCNAME string
	domain      string
	zoneID      string
	http        *http.Client
	stdout      io.Writer
}

func (c *cfTunnel) hostnameFor(port int) string { return fmt.Sprintf("g-%d.%s", port, c.domain) }

func (c *cfTunnel) api(method, path string, payload any) (map[string]any, error) {
	endpoint := "https://api.cloudflare.com/client/v4/" + path
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(data)
	}
	req, err := http.NewRequest(method, endpoint, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var out map[string]any
	if err := json.Unmarshal(data, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (c *cfTunnel) getConfig() (map[string]any, error) {
	out, err := c.api(http.MethodGet, fmt.Sprintf("accounts/%s/cfd_tunnel/%s/configurations", c.accountID, c.tunnelID), nil)
	if err != nil {
		return nil, err
	}
	if success, _ := out["success"].(bool); !success {
		return nil, fmt.Errorf("获取配置失败: %v", out["errors"])
	}
	result := asMap(out["result"])
	return asMap(result["config"]), nil
}

func (c *cfTunnel) putConfig(config map[string]any) error {
	out, err := c.api(http.MethodPut, fmt.Sprintf("accounts/%s/cfd_tunnel/%s/configurations", c.accountID, c.tunnelID), map[string]any{"config": config})
	if err != nil {
		return err
	}
	if success, _ := out["success"].(bool); !success {
		return fmt.Errorf("更新配置失败: %v", out["errors"])
	}
	return nil
}

func (c *cfTunnel) dnsList() ([]map[string]any, error) {
	var all []map[string]any
	for page := 1; ; page++ {
		out, err := c.api(http.MethodGet, fmt.Sprintf("zones/%s/dns_records?type=CNAME&per_page=100&page=%d", c.zoneID, page), nil)
		if err != nil {
			return nil, err
		}
		if success, _ := out["success"].(bool); !success {
			return nil, fmt.Errorf("dns list failed: %v", out["errors"])
		}
		result, _ := out["result"].([]any)
		if len(result) == 0 {
			break
		}
		for _, item := range result {
			all = append(all, asMap(item))
		}
		if len(result) < 100 {
			break
		}
	}
	return all, nil
}

func (c *cfTunnel) dnsAdd(hostname string) bool {
	out, err := c.api(http.MethodPost, fmt.Sprintf("zones/%s/dns_records", c.zoneID), map[string]any{
		"type":    "CNAME",
		"name":    hostname,
		"content": c.tunnelCNAME,
		"proxied": true,
		"ttl":     1,
	})
	if err != nil {
		return false
	}
	if success, _ := out["success"].(bool); success {
		return true
	}
	errorsList, _ := out["errors"].([]any)
	for _, item := range errorsList {
		if strings.Contains(strings.ToLower(fmt.Sprint(item)), "already") {
			return true
		}
	}
	return false
}

func (c *cfTunnel) dnsDel(hostname string) bool {
	records, err := c.dnsList()
	if err != nil {
		return false
	}
	for _, rec := range records {
		if anyString(rec["name"]) == hostname {
			out, err := c.api(http.MethodDelete, fmt.Sprintf("zones/%s/dns_records/%s", c.zoneID, anyString(rec["id"])), nil)
			if err != nil {
				return false
			}
			success, _ := out["success"].(bool)
			return success
		}
	}
	return false
}

func (c *cfTunnel) list() error {
	config, err := c.getConfig()
	if err != nil {
		return err
	}
	ingress, _ := config["ingress"].([]any)
	count := 0
	for _, item := range ingress {
		if _, ok := asMap(item)["hostname"]; ok {
			count++
		}
	}
	_, _ = fmt.Fprintf(c.stdout, "📡 Tunnel 路由 (%d 条):\n\n", count)
	for _, item := range ingress {
		rule := asMap(item)
		hostname := anyString(rule["hostname"])
		if hostname == "" {
			hostname = "(catch-all)"
		}
		service := anyString(rule["service"])
		status := ""
		if strings.Contains(service, "localhost:") {
			parts := strings.Split(service, ":")
			port, _ := strconv.Atoi(parts[len(parts)-1])
			if portListening(port) {
				status = " ✅"
			} else {
				status = " ❌"
			}
		}
		_, _ = fmt.Fprintf(c.stdout, "  %s → %s%s\n", hostname, service, status)
	}
	return nil
}

func portListening(port int) bool {
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", port), time.Second)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

func (c *cfTunnel) add(ports []int) error {
	config, err := c.getConfig()
	if err != nil {
		return err
	}
	ingress, _ := config["ingress"].([]any)
	catchAll := map[string]any{"service": "http_status:404"}
	var rules []map[string]any
	for _, item := range ingress {
		rule := asMap(item)
		if anyString(rule["hostname"]) == "" {
			catchAll = rule
			continue
		}
		rules = append(rules, rule)
	}
	existing := map[string]bool{}
	for _, rule := range rules {
		existing[anyString(rule["hostname"])] = true
	}
	type addItem struct {
		port     int
		hostname string
	}
	var added []addItem
	for _, port := range ports {
		hostname := c.hostnameFor(port)
		if existing[hostname] {
			_, _ = fmt.Fprintf(c.stdout, "  ⏭️  %s 已存在 %s\n", hostname, ternary(portListening(port), "✅", "❌ 端口未监听"))
			continue
		}
		if !portListening(port) {
			_, _ = fmt.Fprintf(c.stdout, "  ⚠️  localhost:%d 未监听，仍然添加路由\n", port)
		}
		rules = append(rules, map[string]any{"hostname": hostname, "service": fmt.Sprintf("http://localhost:%d", port)})
		added = append(added, addItem{port: port, hostname: hostname})
	}
	if len(added) == 0 {
		_, _ = fmt.Fprintln(c.stdout, "\n没有新增路由")
		return nil
	}
	config["ingress"] = append(anySliceFromMap(rules), catchAll)
	if err := c.putConfig(config); err != nil {
		return err
	}
	for _, item := range added {
		ok := c.dnsAdd(item.hostname)
		_, _ = fmt.Fprintf(c.stdout, "  ✅ %s → localhost:%d  DNS:%s\n", item.hostname, item.port, ternary(ok, "✅", "❌"))
	}
	_, _ = fmt.Fprintf(c.stdout, "\n🎉 成功添加 %d 条路由\n", len(added))
	return nil
}

func (c *cfTunnel) del(ports []int) error {
	config, err := c.getConfig()
	if err != nil {
		return err
	}
	ingress, _ := config["ingress"].([]any)
	catchAll := map[string]any{"service": "http_status:404"}
	var rules []map[string]any
	for _, item := range ingress {
		rule := asMap(item)
		if anyString(rule["hostname"]) == "" {
			catchAll = rule
			continue
		}
		rules = append(rules, rule)
	}
	toDelete := map[string]bool{}
	for _, port := range ports {
		toDelete[c.hostnameFor(port)] = true
	}
	var kept []map[string]any
	var removed []string
	for _, rule := range rules {
		if toDelete[anyString(rule["hostname"])] {
			removed = append(removed, anyString(rule["hostname"]))
		} else {
			kept = append(kept, rule)
		}
	}
	if len(removed) == 0 {
		_, _ = fmt.Fprintln(c.stdout, "没有匹配的路由")
		return nil
	}
	config["ingress"] = append(anySliceFromMap(kept), catchAll)
	if err := c.putConfig(config); err != nil {
		return err
	}
	for _, hostname := range removed {
		ok := c.dnsDel(hostname)
		_, _ = fmt.Fprintf(c.stdout, "  🗑️  %s  DNS:%s\n", hostname, ternary(ok, "✅", "⚠️ 未找到"))
	}
	_, _ = fmt.Fprintf(c.stdout, "\n🎉 成功删除 %d 条路由\n", len(removed))
	return nil
}

func anySliceFromMap(items []map[string]any) []any {
	out := make([]any, 0, len(items))
	for _, item := range items {
		out = append(out, item)
	}
	return out
}

func ternary(cond bool, a, b string) string {
	if cond {
		return a
	}
	return b
}

func (e *Env) runCPing(args []string) error {
	if len(args) < 1 {
		return errors.New("Usage: cping <domain_or_ip>")
	}
	target := args[0]
	ip := target
	if addrs, err := net.LookupHost(target); err == nil && len(addrs) > 0 {
		ip = addrs[0]
	}
	_, _ = fmt.Fprintf(e.Stdout, "\n🏓 cping - %s (%s)\n", target, ip)
	_, _ = fmt.Fprintln(e.Stdout, strings.Repeat("━", 50))
	resp, err := e.HTTP.Get("https://www.itdog.cn/ping/" + target)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return errors.New("无法获取数据")
	}
	html := string(body)
	rowRe := regexp.MustCompile(`<tr class="node_tr"[^>]*>(.*?)</tr>`)
	ispRe := regexp.MustCompile(`badge[^"]*">(.*?)</span>\s*(.*?)\s*</td>`)
	avgRe := regexp.MustCompile(`id="avg_ping_\d+"[^>]*>([^<]+)`)
	lossRe := regexp.MustCompile(`id="loss_\d+"[^>]*>([^<]+)`)
	type result struct {
		isp      string
		location string
		avg      string
		loss     string
	}
	var results []result
	for _, row := range rowRe.FindAllStringSubmatch(html, -1) {
		m := ispRe.FindStringSubmatch(row[1])
		if len(m) != 3 {
			continue
		}
		avg := "--"
		if v := avgRe.FindStringSubmatch(row[1]); len(v) == 2 {
			avg = strings.TrimSpace(v[1])
		}
		loss := ""
		if v := lossRe.FindStringSubmatch(row[1]); len(v) == 2 {
			loss = strings.TrimSpace(v[1])
		}
		results = append(results, result{isp: strings.TrimSpace(m[1]), location: strings.TrimSpace(m[2]), avg: avg, loss: loss})
	}
	if len(results) == 0 {
		return errors.New("无法获取数据")
	}
	groups := map[string][]result{}
	for _, item := range results {
		groups[item.isp] = append(groups[item.isp], item)
	}
	for _, isp := range []string{"电信", "联通", "移动", "海外"} {
		nodes := groups[isp]
		if len(nodes) == 0 {
			continue
		}
		_, _ = fmt.Fprintf(e.Stdout, "\n  📡 %s:\n", isp)
		for _, node := range nodes {
			_, _ = fmt.Fprintf(e.Stdout, "    %-12s avg=%-8s loss=%s\n", node.location, node.avg, node.loss)
		}
	}
	_, _ = fmt.Fprintln(e.Stdout)
	return nil
}
