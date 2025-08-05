#!/usr/bin/env python3
"""
Script executável para 01 - Historico de Consumo
Gerado automaticamente pelo ConectaBoi ETL
"""

import sys
import os
from pathlib import Path

# Adicionar diretório backend ao path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_dir))

# Executar o script principal
if __name__ == "__main__":
    exec(open(r"C:\Projetos\ConectaBoi-ETL\backend\api\..\..\generated_scripts\01 - Historico de Consumo.py").read())
