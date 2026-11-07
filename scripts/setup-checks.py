"""Optional validation tooling, unpacked into disposable scratch without node_modules.

The delivered game needs none of these packages. Python 3 and network access are
needed only to reproduce the worker's TypeScript and DOM validation.
"""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

PACKAGES = {
    "typescript": "5.9.3",
    "happy-dom": "21.0.4",
    "ws": "8.21.0",
    "entities": "7.0.1",
    "whatwg-mimetype": "3.0.0",
    "buffer-image-size": "0.6.4",
}

for name, version in PACKAGES.items():
    with urllib.request.urlopen(f"https://registry.npmjs.org/{name}/{version}") as response:
        metadata = json.load(response)
    with urllib.request.urlopen(metadata["dist"]["tarball"]) as response:
        data = response.read()
    expected = metadata["dist"]["integrity"]
    actual = "sha512-" + base64.b64encode(hashlib.sha512(data).digest()).decode()
    if actual != expected:
        raise ValueError(f"Package integrity failed: {name}")
    target = Path("test/scratch/tools") / name
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile() or not member.name.startswith("package/"):
                continue
            relative = Path(member.name).relative_to("package")
            if ".." in relative.parts or "node_modules" in relative.parts:
                raise ValueError("Unexpected archive path")
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(archive.extractfile(member).read())
    print(f"Prepared {name}@{version} in disposable test tooling")
