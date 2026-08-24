package handler

// Skills 聚合管理（跨三端技能统一治理，类似 CC Switch）。
//
// 把 Hermes（本应用）、Claude Code、OpenAI Codex 三处本地的 SKILL.md 技能
// 聚合到一个视图：按技能名归并，展示每端的位置/校验和，冲突（版本不同）时
// 可挑选任一端作为来源同步到其他端，覆盖前自动备份。
//
//   GET  /api/skills/aggregate        —— 扫描三端技能目录并聚合
//   POST /api/skills/aggregate/sync   —— 把某一端技能同步到其余端（带备份）

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// aggregatePlatform 描述一个可同步的技能端。
type aggregatePlatform struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	Count     int    `json:"count"`
	Available bool   `json:"available"`
}

// aggregateSkillLocation 一个技能在某一端的落点。
type aggregateSkillLocation struct {
	Platform     string `json:"platform"`
	PlatformName string `json:"platform_name"`
	Path         string `json:"path"`          // 绝对路径（技能目录）
	RelativePath string `json:"relative_path"` // 目录名
	Checksum     string `json:"checksum"`      // 技能包内容校验和（sha256，前 12 位）
}

// aggregateSkill 聚合后的一个技能条目。
type aggregateSkill struct {
	Name        string                       `json:"name"`
	Description string                       `json:"description"`
	Conflict    bool                         `json:"conflict"`
	Locations   []aggregateSkillLocation     `json:"locations"`
}

// aggregateSkillPlatformDir 返回三端各自的技能根目录。
// hermes 复用本应用的 externalSkillsDir（SKILL.md 文件夹挂载点）；
// claude 用 ~/.claude/skills；codex 用 ~/.codex/skills。目录不存在时
// 该端标记为 unavailable，聚合时跳过但保留在平台列表里供前端展示。
func aggregateSkillPlatformDir(id string) (string, bool) {
	switch id {
	case "hermes":
		return externalSkillsDir(), true
	case "claude":
		return filepath.Join(userHomeSafe(), ".claude", "skills"), true
	case "codex":
		return filepath.Join(userHomeSafe(), ".codex", "skills"), true
	}
	return "", false
}

func userHomeSafe() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	return home
}

var aggregatePlatformDefs = []aggregatePlatform{
	{ID: "hermes", Label: "Hermes"},
	{ID: "claude", Label: "Claude Code"},
	{ID: "codex", Label: "Codex"},
}

// aggregateSkillChecksum 计算一个技能目录下全部文件的 sha256 摘要，用于跨端比对版本。
// 按相对路径排序拼接，保证两端同内容 → 同校验和。
func aggregateSkillChecksum(dir string) string {
	h := sha256.New()
	var rels []string
	_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		rel, rerr := filepath.Rel(dir, path)
		if rerr == nil {
			rels = append(rels, rel)
		}
		return nil
	})
	sort.Strings(rels)
	for _, rel := range rels {
		data, err := os.ReadFile(filepath.Join(dir, rel))
		if err != nil {
			continue
		}
		_, _ = io.WriteString(h, rel+"\n")
		_, _ = h.Write(data)
	}
	return hex.EncodeToString(h.Sum(nil))
}

// scanAggregateSkillsInDir 扫描单个技能根目录，返回 skillName → location。
func scanAggregateSkillsInDir(root, platform, platformName string) map[string]aggregateSkillLocation {
	out := make(map[string]aggregateSkillLocation)
	entries, err := os.ReadDir(root)
	if err != nil {
		return out
	}
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		dir := filepath.Join(root, e.Name())
		skillMD := filepath.Join(dir, "SKILL.md")
		if _, err := os.Stat(skillMD); err != nil {
			continue
		}
		out[e.Name()] = aggregateSkillLocation{
			Platform:     platform,
			PlatformName: platformName,
			Path:         dir,
			RelativePath: e.Name(),
			Checksum:     aggregateSkillChecksum(dir),
		}
	}
	return out
}

// HandleAggregateSkills GET /api/skills/aggregate —— 扫描三端技能并聚合返回。
func HandleAggregateSkills(c *gin.Context) {
	// 端级扫描（目录不存在 → 空 map + 该端 unavailable）
	byPlatform := make(map[string]map[string]aggregateSkillLocation, len(aggregatePlatformDefs))
	platforms := make([]aggregatePlatform, 0, len(aggregatePlatformDefs))
	for _, def := range aggregatePlatformDefs {
		root, ok := aggregateSkillPlatformDir(def.ID)
		loc := scanAggregateSkillsInDir(root, def.ID, def.Label)
		byPlatform[def.ID] = loc
		platforms = append(platforms, aggregatePlatform{
			ID: def.ID, Label: def.Label, Count: len(loc), Available: ok,
		})
	}

	// 按技能名归并
	byName := make(map[string]*aggregateSkill)
	for _, def := range aggregatePlatformDefs {
		for name, loc := range byPlatform[def.ID] {
			skill, exists := byName[name]
			if !exists {
				skill = &aggregateSkill{Name: name}
				byName[name] = skill
			}
			skill.Locations = append(skill.Locations, loc)
		}
	}

	skills := make([]aggregateSkill, 0, len(byName))
	for _, skill := range byName {
		// 冲突判定：任一两端校验和不同即视为版本不同
		for i := 1; i < len(skill.Locations); i++ {
			if skill.Locations[i].Checksum != skill.Locations[0].Checksum {
				skill.Conflict = true
				break
			}
		}
		// 描述取首个有内容的 SKILL.md frontmatter
		if len(skill.Locations) > 0 {
			skill.Description = readSkillDescription(filepath.Join(skill.Locations[0].Path, "SKILL.md"))
		}
		sort.Slice(skill.Locations, func(i, j int) bool { return skill.Locations[i].Platform < skill.Locations[j].Platform })
		skills = append(skills, *skill)
	}
	sort.Slice(skills, func(i, j int) bool { return skills[i].Name < skills[j].Name })

	c.JSON(200, gin.H{"skills": skills, "platforms": platforms})
}

// readSkillDescription 解析 SKILL.md 的 frontmatter 取 description。
func readSkillDescription(skillMDPath string) string {
	data, err := os.ReadFile(skillMDPath)
	if err != nil {
		return ""
	}
	_, desc, _ := parseSkillMD(string(data))
	return desc
}

// HandleSyncAggregateSkill POST /api/skills/aggregate/sync —— 把来源端技能同步到目标端。
// Body: { name, source, source_path, targets: [platform...] }
// 覆盖目标端同名技能前先备份到 <平台>/_backup/<技能名>-<时间戳>/。
func HandleSyncAggregateSkill(c *gin.Context) {
	var body struct {
		Name       string   `json:"name"`
		Source     string   `json:"source"`
		SourcePath string   `json:"source_path"`
		Targets    []string `json:"targets"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": "请求体不是合法 JSON"})
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	body.Source = strings.TrimSpace(body.Source)
	body.SourcePath = strings.TrimSpace(body.SourcePath)
	if body.Name == "" || body.Source == "" || body.SourcePath == "" {
		c.JSON(400, gin.H{"error": "缺少技能名、来源端或来源路径"})
		return
	}
	srcRoot, ok := aggregateSkillPlatformDir(body.Source)
	if !ok {
		c.JSON(400, gin.H{"error": "不支持的来源端"})
		return
	}
	srcDir := filepath.Clean(body.SourcePath)
	if !strings.HasPrefix(srcDir, filepath.Clean(srcRoot)+string(filepath.Separator)) {
		c.JSON(400, gin.H{"error": "来源路径不在该端技能目录内"})
		return
	}
	if _, err := os.Stat(filepath.Join(srcDir, "SKILL.md")); err != nil {
		c.JSON(400, gin.H{"error": "来源端技能目录缺少 SKILL.md"})
		return
	}

	if len(body.Targets) == 0 {
		c.JSON(400, gin.H{"error": "未指定同步目标端"})
		return
	}
	results := make([]gin.H, 0, len(body.Targets))
	for _, target := range body.Targets {
		results = append(results, syncSkillToPlatform(body.Name, srcDir, target))
	}
	c.JSON(200, gin.H{"ok": true, "results": results})
}

// syncSkillToPlatform 把一个技能目录完整复制到目标端；目标端已有同名目录时先备份。
func syncSkillToPlatform(name, srcDir, target string) gin.H {
	targetRoot, ok := aggregateSkillPlatformDir(target)
	if !ok {
		return gin.H{"platform": target, "ok": false, "error": "不支持的平台"}
	}
	targetDir := filepath.Join(targetRoot, name)

	// 收集源目录全部文件
	var files []struct {
		Rel  string
		Path string
	}
	_ = filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		rel, rerr := filepath.Rel(srcDir, path)
		if rerr != nil {
			return nil
		}
		files = append(files, struct {
			Rel  string
			Path string
		}{Rel: rel, Path: path})
		return nil
	})
	if len(files) == 0 {
		return gin.H{"platform": target, "ok": false, "error": "来源端技能为空"}
	}

	// 覆盖前备份（仅当目标已存在）
	if _, err := os.Stat(targetDir); err == nil {
		backupRoot := filepath.Join(targetRoot, "_backup")
		_ = os.MkdirAll(backupRoot, 0o755)
		backupDir := filepath.Join(backupRoot, fmt.Sprintf("%s-%d", name, time.Now().Unix()))
		if err := copyDir(targetDir, backupDir); err != nil {
			return gin.H{"platform": target, "ok": false, "error": "备份目标端失败: " + err.Error()}
		}
	}

	// 原子写入：先写 staging 再 rename
	parent := filepath.Dir(targetRoot)
	if err := os.MkdirAll(parent, 0o755); err != nil {
		return gin.H{"platform": target, "ok": false, "error": err.Error()}
	}
	staging, err := os.MkdirTemp(parent, ".skill-sync-")
	if err != nil {
		return gin.H{"platform": target, "ok": false, "error": err.Error()}
	}
	defer os.RemoveAll(staging)
	for _, f := range files {
		if !safeRelativeSkillPath(filepath.ToSlash(f.Rel)) {
			return gin.H{"platform": target, "ok": false, "error": "技能包含越界路径"}
		}
		dst := filepath.Join(staging, f.Rel)
		if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
			return gin.H{"platform": target, "ok": false, "error": err.Error()}
		}
		in, err := os.Open(f.Path)
		if err != nil {
			return gin.H{"platform": target, "ok": false, "error": err.Error()}
		}
		contents, rerr := io.ReadAll(in)
		in.Close()
		if rerr != nil {
			return gin.H{"platform": target, "ok": false, "error": rerr.Error()}
		}
		if err := os.WriteFile(dst, contents, 0o644); err != nil {
			return gin.H{"platform": target, "ok": false, "error": err.Error()}
		}
	}
	_ = os.RemoveAll(targetDir)
	if err := os.Rename(staging, targetDir); err != nil {
		return gin.H{"platform": target, "ok": false, "error": err.Error()}
	}
	return gin.H{"platform": target, "ok": true}
}

// copyDir 递归复制目录。
func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, rerr := filepath.Rel(src, path)
		if rerr != nil {
			return rerr
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		in, err := os.Open(path)
		if err != nil {
			return err
		}
		defer in.Close()
		out, err := os.Create(target)
		if err != nil {
			return err
		}
		if _, err := io.Copy(out, in); err != nil {
			out.Close()
			return err
		}
		return out.Close()
	})
}
