// backend/database.go
package main

import (
    "database/sql"
    "log"
    _ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func init() {
    var err error
    // 替换为你的MySQL密码
    dsn := "root:Gdx9pyrz.@tcp(127.0.0.1:3306)/shanca_blog?parseTime=true&charset=utf8mb4"
    db, err = sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal("数据库连接失败: ", err)
    }
    db.SetMaxOpenConns(10)
    db.SetMaxIdleConns(5)
}