import os
import sys
import tempfile


def main() -> None:
    if len(sys.argv) != 2:
        print("runner: expected source code argument", file=sys.stderr)
        sys.exit(2)

    source = sys.argv[1]

    fd, path = tempfile.mkstemp(
        suffix=".py",
        prefix="codeaudit-",
        dir="/tmp",
    )

    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            file.write(source)

        os.execv(
            sys.executable,
            [sys.executable, path],
        )

    finally:
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass


if __name__ == "__main__":
    main()