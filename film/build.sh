#!/usr/bin/env bash
# 依序：拍点网格与分镜表（含年代校验）→ 配乐 → 逐帧渲染并合成
set -euo pipefail
cd "$(dirname "$0")"
python3 timeline.py
python3 music.py
python3 render.py --video --jobs "${JOBS:-4}"
