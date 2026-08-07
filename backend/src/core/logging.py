"""
BCOS Platform — Structured Logging

Uses structlog for JSON-formatted, context-rich logging.
"""

import logging
import sys

import structlog


def setup_logging(level: str = "INFO") -> structlog.stdlib.BoundLogger:
    """Configure structured logging for the BCOS platform."""

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(level)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging for third-party libraries
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.getLevelName(level),
    )

    logger = structlog.get_logger("bcos")
    logger.info("Logging initialized", level=level)
    return logger


def get_logger(name: str = "bcos") -> structlog.stdlib.BoundLogger:
    """Get a named logger instance."""
    return structlog.get_logger(name)
