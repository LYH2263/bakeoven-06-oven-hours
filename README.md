# BakeOven

烘焙占炉排程：发酵+烘烤半开区间占用炉位，冲突检测与下一可开工窗口。

## 启动

```bash
docker compose up --build
```

| 服务 | 地址 |
| --- | --- |
| 前端 | http://localhost:4500 |
| API | http://localhost:9500 |
| API 文档 | http://localhost:9500/docs |
| Postgres | localhost:5446 |

健康检查：`GET http://localhost:9500/api/health`

## 页面

- `/products` — 产品
- `/ovens` — 炉位
- `/batches` — 批次
- `/gantt` — 甘特
- `/conflicts` — 冲突
- `/windows` — 可开工

## 使用说明

1. 查看产品配方时长与炉位。
2. 炉位页可登记每座炉的开门/打烊分钟（半开区间，打烊点不可排；未改的炉默认 08:00–22:00）。
3. 创建生产批次，系统按半开区间占炉并检测冲突；整批（发酵+烘烤）探出该炉营业时段会被拒绝。
4. 甘特查看占用与各炉营业带；冲突与可开工窗口（按各炉自己的营业时段搜索）辅助排产。

## API 补充

- `PUT /api/ovens/{id}/hours` — 修改炉位营业时段，body：`{"open_min": 480, "close_min": 1320}`；`open_min >= close_min` 拒绝保存。

## 开发与测试

```bash
docker compose exec api pytest -q
```
