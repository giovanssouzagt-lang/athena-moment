"""Testes da Athena Inteligente com o Gemini simulado (sem internet e sem chave)."""
import json

import athena.ia as ia


class _Resposta:
    def __init__(self, status, corpo):
        self.status_code = status
        self.ok = status == 200
        self._corpo = corpo
        self.text = json.dumps(corpo)

    def json(self):
        return self._corpo


def _gemini_respondendo(objeto, finish="STOP"):
    return _Resposta(200, {
        "candidates": [{"finishReason": finish, "content": {"parts": [{"text": json.dumps(objeto)}]}}],
        "usageMetadata": {"promptTokenCount": 10, "candidatesTokenCount": 5},
    })


def test_sem_chave_desliga_a_ia(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert ia.analisar_noticias(["PETR4"], "2026-11-19") is None
    assert ia.gerar_relatorio([{"data": "x", "top": []}], [], "semana") is None


def test_chave_vai_no_cabecalho_e_json_e_lido(monkeypatch):
    chamadas = []

    def post(url, json, timeout, headers):
        chamadas.append((url, json, headers))
        return _gemini_respondendo({"ok": True})

    monkeypatch.setattr(ia.requests, "post", post)
    assert ia._perguntar_json("CHAVE", "sistema", "conteudo", {"type": "object"}) == ({"ok": True}, ia.MODELOS[0])
    url, corpo, headers = chamadas[0]
    assert "CHAVE" not in url
    assert headers["x-goog-api-key"] == "CHAVE"
    assert corpo["generationConfig"]["responseJsonSchema"] == {"type": "object"}
    assert corpo["systemInstruction"]["parts"][0]["text"] == "sistema"


def test_bloqueio_devolve_none(monkeypatch):
    monkeypatch.setattr(ia.requests, "post", lambda *a, **k: _gemini_respondendo({}, finish="SAFETY"))
    assert ia._perguntar_json("CHAVE", "s", "c", {}) == (None, None)


def test_limite_do_plano_gratuito_tenta_de_novo(monkeypatch):
    respostas = [_Resposta(429, {"error": "quota"}), _gemini_respondendo({"ok": 1})]
    monkeypatch.setattr(ia.requests, "post", lambda *a, **k: respostas.pop(0))
    monkeypatch.setattr(ia.time, "sleep", lambda s: None)
    assert ia._perguntar_json("CHAVE", "s", "c", {}) == ({"ok": 1}, ia.MODELOS[0])


def test_analise_ignora_ticker_que_nao_foi_pedido(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "CHAVE")
    monkeypatch.setattr(ia.time, "sleep", lambda s: None)
    monkeypatch.setattr(ia, "buscar_noticias", lambda t: [{"titulo": "Lucro sobe", "fonte": "X", "link": "l", "data": "2026-11-19"}])
    resposta = {"acoes": [
        {"ticker": "PETR4", "resumo": "ok", "risco": "nenhum", "motivo": "", "manchetes_usadas": [0, 9]},
        {"ticker": "INVENTADA", "resumo": "x", "risco": "alto", "motivo": "x", "manchetes_usadas": []},
    ]}
    monkeypatch.setattr(ia.requests, "post", lambda *a, **k: _gemini_respondendo(resposta))
    analise = ia.analisar_noticias(["PETR4", "VALE3"], "2026-11-19")
    assert set(analise["acoes"]) == {"PETR4", "VALE3"}
    assert len(analise["acoes"]["PETR4"]["fontes"]) == 1  # índice 9 inexistente é descartado
    assert analise["acoes"]["VALE3"]["risco"] == "nenhum"


def test_modelo_travado_passa_para_o_reserva(monkeypatch):
    monkeypatch.setattr(ia, "MODELOS", ["principal", "reserva"])

    def post(url, json, timeout, headers):
        if "/principal:" in url:
            raise ia.requests.exceptions.ReadTimeout("travou")
        return _gemini_respondendo({"ok": 2})

    monkeypatch.setattr(ia.requests, "post", post)
    assert ia._perguntar_json("CHAVE", "s", "c", {}) == ({"ok": 2}, "reserva")


def test_resposta_cortada_passa_para_o_reserva(monkeypatch):
    monkeypatch.setattr(ia, "MODELOS", ["principal", "reserva"])
    monkeypatch.setattr(ia.requests, "post", lambda url, **k: _gemini_respondendo({"ok": 3}, finish="MAX_TOKENS" if "/principal:" in url else "STOP"))
    assert ia._perguntar_json("CHAVE", "s", "c", {}) == ({"ok": 3}, "reserva")


def test_todos_os_modelos_falham_gera_erro(monkeypatch):
    import pytest
    monkeypatch.setattr(ia, "MODELOS", ["a", "b"])
    monkeypatch.setattr(ia.time, "sleep", lambda s: None)
    monkeypatch.setattr(ia.requests, "post", lambda *a, **k: _Resposta(503, {"error": "ocupado"}))
    with pytest.raises(RuntimeError):
        ia._perguntar_json("CHAVE", "s", "c", {})
