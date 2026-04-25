from __future__ import annotations

from typing import Any

from core.constants import ERROR_CODE_QUOTA_EXCEEDED


def evaluate_planogram_quota(
    current_count: int,
    annual_planogram_limit: int | None,
    is_unlimited: bool = False,
) -> dict[str, Any]:
    if is_unlimited or annual_planogram_limit is None:
        return {
            "allowed": True,
            "limit": None,
            "remaining": None,
            "blocked": False,
            "error_code": None,
        }

    remaining = max(annual_planogram_limit - current_count, 0)
    allowed = current_count < annual_planogram_limit

    return {
        "allowed": allowed,
        "limit": annual_planogram_limit,
        "remaining": remaining,
        "blocked": not allowed,
        "error_code": None if allowed else ERROR_CODE_QUOTA_EXCEEDED,
    }