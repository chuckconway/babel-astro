/* global jsyaml */
class PostEditor {
  constructor() {
    this.postSelect = document.getElementById("postSelect");
    // Map of front-matter field inputs
    this.fmInputs = {
      id: document.getElementById("fm_id"),
      title: document.getElementById("fm_title"),
      slug: document.getElementById("fm_slug"),
      date: document.getElementById("fm_date"),
      canonicalURL: document.getElementById("fm_canonicalURL"),
      author: document.getElementById("fm_author"),
      description: document.getElementById("fm_description"),
      ogImage: document.getElementById("fm_ogImage"),
      tags: document.getElementById("fm_tags"),
    };

    this.content = document.getElementById("content");
    this.statusLine = document.getElementById("status");
    this.notesList = document.getElementById("notesList");
    this.addNoteBtn = document.getElementById("addNoteBtn");

    // Panel toggle refs
    this.frontMatterPanel = document.getElementById("frontMatterPanel");
    this.toggleBtnMobile = document.getElementById("togglePanelBtn");
    this.toggleBtnDesktop = document.getElementById("togglePanelBtnDesktop");
    this.panelOpen = true;

    if (this.toggleBtnMobile) {
      this.toggleBtnMobile.addEventListener("click", () => this.togglePanel());
    }
    if (this.toggleBtnDesktop) {
      this.toggleBtnDesktop.addEventListener("click", () => this.togglePanel());
    }

    if (this.addNoteBtn) {
      this.addNoteBtn.addEventListener("click", () => this.addNote());
    }

    // Keep slug in sync with title
    this.fmInputs.title.addEventListener("input", () => {
      this.fmInputs.slug.value = this.slugify(this.fmInputs.title.value);
    });

    this.currentFilename = "";

    // Bind events
    document.getElementById("loadBtn").addEventListener("click", () => this.loadSelected());
    document.getElementById("newBtn").addEventListener("click", () => this.newPost());
    document.getElementById("saveBtn").addEventListener("click", () => this.save());

    // Initial load
    this.refreshList();
  }

  async refreshList() {
    try {
      const res = await fetch("/api/posts");
      const files = await res.json();
      this.postSelect.innerHTML =
        `<option value="">-- Select a post --</option>` +
        files.map((f) => `<option value="${f}">${f}</option>`).join("");
    } catch (err) {
      this.setStatus(err.message, true);
    }
  }

  async loadSelected() {
    const filename = this.postSelect.value;
    if (!filename) return;
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error("Failed to load post");
      const data = await res.json();
      this.currentFilename = filename;
      // Parse YAML into object and populate inputs
      const fmObj = jsyaml.load(data.frontMatter) || {};
      this.populateFields(fmObj);
      this.content.value = data.content;
      this.setStatus(`Loaded ${filename}`);
    } catch (err) {
      this.setStatus(err.message, true);
    }
  }

  newPost() {
    // Clear all front-matter fields
    this.populateFields({
      title: "New Post",
      date: new Date().toISOString(),
      id: this.generateId(),
      author: "Chuck Conway",
    });
    // Clear dropdown selection
    this.postSelect.value = "";
    // Generate initial slug
    this.fmInputs.slug.value = this.slugify(this.fmInputs.title.value);
    this.content.value = "";
    this.setStatus("Creating new post (remember to provide a title)");
    this.renderNotes([]);
  }

  async save() {
    const fmObj = this.collectFields();
    // Ensure tags is array
    if (typeof fmObj.tags === "string") {
      fmObj.tags = fmObj.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    const frontMatterYaml = jsyaml.dump(fmObj, { lineWidth: -1 });

    const body = {
      frontMatter: frontMatterYaml,
      content: this.content.value,
    };
    try {
      let res;
      if (this.currentFilename) {
        res = await fetch(`/api/posts/${encodeURIComponent(this.currentFilename)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      const result = await res.json();
      if (result.filename) {
        this.currentFilename = result.filename;
      }
      this.setStatus("Saved ✅");
      // Refresh list so newly created posts appear
      await this.refreshList();
      // If new post, select it in dropdown
      if (this.currentFilename) {
        this.postSelect.value = this.currentFilename;
      }
    } catch (err) {
      this.setStatus(err.message, true);
    }
  }

  setStatus(msg, isError = false) {
    this.statusLine.textContent = msg;
    this.statusLine.className = isError ? "text-red-600" : "text-green-700";
  }

  togglePanel() {
    if (!this.frontMatterPanel) return;
    this.panelOpen = !this.panelOpen;

    if (this.panelOpen) {
      // Expand – reset inline width so CSS (w-96) applies, then fade in
      this.frontMatterPanel.style.width = "";
      this.frontMatterPanel.style.opacity = "1";
      if (this.toggleBtnDesktop) this.toggleBtnDesktop.innerHTML = "&#x25C0;"; // left arrow
      if (this.toggleBtnMobile) this.toggleBtnMobile.textContent = "Hide";
    } else {
      // Collapse – animate width to 0 then hide visually
      this.frontMatterPanel.style.width = "0px";
      this.frontMatterPanel.style.opacity = "0";
      if (this.toggleBtnDesktop) this.toggleBtnDesktop.innerHTML = "&#x25B6;"; // right arrow
      if (this.toggleBtnMobile) this.toggleBtnMobile.textContent = "Show";
    }
  }

  populateFields(obj = {}) {
    Object.keys(this.fmInputs).forEach((key) => {
      if (key === "tags" && Array.isArray(obj[key])) {
        this.fmInputs[key].value = obj[key].join(", ");
      } else if (obj[key] !== undefined) {
        // For date input convert to datetime-local value (YYYY-MM-DDTHH:MM)
        if (key === "date" && obj[key]) {
          const iso = new Date(obj[key]).toISOString().slice(0, 16);
          this.fmInputs[key].value = iso;
        } else {
          this.fmInputs[key].value = obj[key];
        }
      } else {
        this.fmInputs[key].value = "";
      }
    });

    this.renderNotes(Array.isArray(obj.notes) ? obj.notes : []);
  }

  generateId() {
    const d = new Date();
    const yy = d.getFullYear().toString().slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    return Number(`${yy}${mm}${dd}${hh}`);
  }

  slugify(str) {
    return str
      .normalize("NFD") // split accent from letters
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove non url-safe chars
      .replace(/\s+/g, "-") // spaces to hyphens
      .replace(/-+/g, "-") // collapse hyphens
      .replace(/^-+|-+$/g, ""); // trim hyphens
  }

  collectFields() {
    const obj = {};
    Object.entries(this.fmInputs).forEach(([key, el]) => {
      let val = el.value;
      if (key === "id" && val) {
        obj[key] = Number(val);
      } else if (key === "date" && val) {
        obj[key] = new Date(val).toISOString();
      } else if (val) {
        obj[key] = val;
      }
    });
    const notes = this.collectNotes();
    if (notes.length) {
      obj.notes = notes;
    }
    return obj;
  }

  createNoteRow(note = {}) {
    const row = document.createElement("div");
    row.setAttribute("data-note-row", "");
    row.className = "border rounded p-2 flex gap-2 items-start";

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.placeholder = "Note text";
    textInput.className = "note-text border rounded p-2 flex-1";
    textInput.value = note.text || "";

    const hrefInput = document.createElement("input");
    hrefInput.type = "url";
    hrefInput.placeholder = "Link (optional)";
    hrefInput.className = "note-href border rounded p-2 flex-1";
    hrefInput.value = note.href || "";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "bg-red-600 text-white rounded px-2 py-1 text-sm";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      row.remove();
    });

    row.appendChild(textInput);
    row.appendChild(hrefInput);
    row.appendChild(removeBtn);
    return row;
  }

  addNote(note = {}) {
    if (!this.notesList) return;
    const row = this.createNoteRow(note);
    this.notesList.appendChild(row);
  }

  renderNotes(notesArray = []) {
    if (!this.notesList) return;
    this.notesList.innerHTML = "";
    notesArray.forEach((n) => this.addNote(n));
  }

  collectNotes() {
    if (!this.notesList) return [];
    const rows = Array.from(this.notesList.querySelectorAll('[data-note-row]'));
    const notes = rows
      .map((row) => {
        const text = row.querySelector('.note-text')?.value?.trim() || "";
        const href = row.querySelector('.note-href')?.value?.trim() || "";
        if (!text) return null;
        const n = { text };
        if (href) n.href = href;
        return n;
      })
      .filter(Boolean);
    return notes;
  }
}

// Kick things off
window.addEventListener("DOMContentLoaded", () => new PostEditor());
