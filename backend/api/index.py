from __future__ import annotations

import os
import sys

# Ensure backend root is importable when deployed as Vercel Python function.
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from main import app  # noqa: E402,F401

