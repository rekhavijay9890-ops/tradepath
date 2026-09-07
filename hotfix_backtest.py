cd /workspaces/tradepath
python3 - <<'EOF'
from pathlib import Path
for f in ("streamlit_app/app.py", "app.py"):
    p = Path(f)
    if not p.exists(): continue
    t = p.read_text()
    t = t.replace('st.session_state["bt_start"] = bt_start.isoformat()', '# removed')
    t = t.replace('st.session_state["bt_end"] = bt_end.isoformat()', '# removed')
    t = t.replace('st.session_state["bt_run_start"] = bt_start.isoformat()', '# removed')
    t = t.replace('st.session_state["bt_run_end"] = bt_end.isoformat()', '# removed')
    if '"bt_results"' not in t and '"bt_report"' in t:
        t = t.replace(
            'st.session_state["bt_report"] = report\n                    st.session_state["bt_df"] = strat_df\n                    st.session_state["bt_symbol"] = selected',
            'st.session_state["bt_results"] = {"report": report, "df": strat_df, "symbol": selected, "start": bt_start.isoformat(), "end": bt_end.isoformat()}'
        )
        t = t.replace('if "bt_report" in st.session_state:', 'if "bt_results" in st.session_state:')
        t = t.replace('report = st.session_state["bt_report"]', 'stored = st.session_state["bt_results"]; report = stored["report"]')
        t = t.replace('strat_df = st.session_state["bt_df"]', 'strat_df = stored["df"]')
        t = t.replace('sym = st.session_state.get("bt_symbol", selected)', 'sym = stored["symbol"]')
        t = t.replace(
            'range_label = (\n            f"{st.session_state.get(\'bt_start\', \'\')} → {st.session_state.get(\'bt_end\', \'\')}"\n        )',
            'range_label = f"{stored[\'start\']} → {stored[\'end\']}"'
        )
        t = t.replace(
            'range_label = (\n            f"{st.session_state.get(\'bt_run_start\', \'\')} → {st.session_state.get(\'bt_run_end\', \'\')}"\n        )',
            'range_label = f"{stored[\'start\']} → {stored[\'end\']}"'
        )
    p.write_text(t)
    print("Patched", f)
EOFx