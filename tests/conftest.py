import sys
from pathlib import Path

# deixa os testes importarem a pasta do projeto e a referência
RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
sys.path.insert(0, str(RAIZ / "tests"))
