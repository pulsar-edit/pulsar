'use babel';

const { CompositeDisposable } = require('atom');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

module.exports = {
  subscriptions: null,
  panel: null,
  element: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'ai-assistant:toggle': () => this.toggle(),
    }));
  },

  deactivate() {
    if (this.panel) this.panel.destroy();
    if (this.subscriptions) this.subscriptions.dispose();
  },

  toggle() {
    if (this.panel) {
      this.panel.isVisible() ? this.panel.hide() : this.panel.show();
      return;
    }
    this.buildUI();
  },

  buildUI() {
    const el = document.createElement('div');
    el.classList.add('ai-assistant-panel');

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';

    const providerSel = document.createElement('select');
    ['codex','claude','gemini'].forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p; providerSel.appendChild(o);
    });
    providerSel.value = atom.config.get('ai-assistant.provider') || 'codex';

    const modelInput = document.createElement('input');
    modelInput.type = 'text';
    modelInput.placeholder = 'model (e.g., gpt-5, o3, gemini-1.5-pro)';
    modelInput.value = atom.config.get('ai-assistant.defaultModel') || '';

    const askBtn = document.createElement('button');
    askBtn.textContent = 'Ask';

    const prompt = document.createElement('textarea');
    prompt.rows = 5; prompt.style.width = '100%';
    prompt.placeholder = 'Ask anything…';

    const output = document.createElement('textarea');
    output.readOnly = true; output.style.width = '100%'; output.rows = 18;

    controls.appendChild(providerSel);
    controls.appendChild(modelInput);
    controls.appendChild(askBtn);
    el.appendChild(controls);
    el.appendChild(prompt);
    el.appendChild(output);

    askBtn.addEventListener('click', async () => {
      const provider = providerSel.value;
      const model = modelInput.value || atom.config.get('ai-assistant.defaultModel');
      const question = prompt.value.trim();
      if (!question) return;
      output.value = '[Working…]';
      try {
        const answer = await this.askProvider(provider, model, question);
        output.value = answer;
      } catch (e) {
        output.value = `Error: ${e.message}`;
      }
    });

    this.element = el;
    this.panel = atom.workspace.addRightPanel({ item: el, visible: true });
  },

  askProvider(provider, model, question) {
    if (provider === 'codex') return this.askCodexCLI(question);
    if (provider === 'claude') return this.askClaude(model, question);
    if (provider === 'gemini') return this.askGemini(model, question);
    return Promise.reject(new Error('Unknown provider'));
  },

  askCodexCLI(question) {
    return new Promise((resolve, reject) => {
      const exe = process.platform === 'win32' ? 'codex.exe' : 'codex';
      const child = spawn(exe, ['exec', question], { env: process.env });
      let out = '';
      let err = '';
      child.stdout.on('data', d => out += d.toString());
      child.stderr.on('data', d => err += d.toString());
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve(out.trim());
        else reject(new Error(err || `codex exited with ${code}`));
      });
    });
  },

  askClaude(model, question) {
    const apiKey = atom.config.get('ai-assistant.anthropicApiKey') || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Promise.reject(new Error('Missing Anthropic API key'));
    const body = JSON.stringify({
      model: model || 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      messages: [{ role: 'user', content: question }]
    });
    return httpPost('api.anthropic.com', '/v1/messages', body, {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    }).then(json => json.content && json.content[0] && json.content[0].text ? json.content[0].text : JSON.stringify(json));
  },

  askGemini(model, question) {
    const apiKey = atom.config.get('ai-assistant.geminiApiKey') || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) return Promise.reject(new Error('Missing Google API key'));
    const m = model || 'gemini-1.5-pro';
    const path = `/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = JSON.stringify({ contents: [{ parts: [{ text: question }] }] });
    return httpPost('generativelanguage.googleapis.com', path, body, {
      'content-type': 'application/json'
    }).then(json => {
      const cand = json.candidates && json.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      return parts && parts[0] && parts[0].text ? parts[0].text : JSON.stringify(json);
    });
  }
};

function httpPost(host, path, body, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ host, path, method: 'POST', headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

