'use client';

import { useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';

function ToolButton({ label, title, active, disabled, onClick, children }) {
  return <button type="button" className={active ? 'is-active' : ''} aria-label={label} aria-pressed={!!active} title={title || label} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function RichTextEditor({ value, onChange }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, defaultProtocol: 'https' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false,
    editorProps: { attributes: { 'aria-label': 'Deskripsi produk' } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => current && ({
      h2: current.isActive('heading', { level: 2 }), h3: current.isActive('heading', { level: 3 }),
      bold: current.isActive('bold'), italic: current.isActive('italic'), underline: current.isActive('underline'), strike: current.isActive('strike'),
      bullet: current.isActive('bulletList'), ordered: current.isActive('orderedList'), quote: current.isActive('blockquote'),
      left: current.isActive({ textAlign: 'left' }), center: current.isActive({ textAlign: 'center' }), right: current.isActive({ textAlign: 'right' }),
      link: current.isActive('link'), canUndo: current.can().undo(), canRedo: current.can().redo(),
      words: current.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length,
    }),
  });

  function openLink() {
    setLinkUrl(editor.getAttributes('link').href || '');
    setLinkError('');
    setLinkOpen(true);
  }

  function saveLink() {
    try {
      const url = new URL(linkUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.href }).run();
      setLinkOpen(false);
      setLinkError('');
    } catch {
      setLinkError('Masukkan URL lengkap yang dimulai dengan https:// atau http://.');
    }
  }

  return <div className="rich-text-editor">
    <div className="rich-text-toolbar" role="toolbar" aria-label="Format deskripsi">
      <div className="rich-text-tool-group">
        <select aria-label="Gaya teks" title="Gaya teks" disabled={!editor} value={state?.h2 ? 'h2' : state?.h3 ? 'h3' : 'p'} onChange={event => {
          const format = event.target.value;
          if (format === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().setHeading({ level: Number(format.slice(1)) }).run();
        }}><option value="p">Paragraf</option><option value="h2">Judul</option><option value="h3">Subjudul</option></select>
      </div>
      <div className="rich-text-tool-group">
        <ToolButton label="Tebal" title="Tebal (Ctrl/Cmd+B)" active={state?.bold} disabled={!editor} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolButton>
        <ToolButton label="Miring" title="Miring (Ctrl/Cmd+I)" active={state?.italic} disabled={!editor} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolButton>
        <ToolButton label="Garis bawah" active={state?.underline} disabled={!editor} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolButton>
        <ToolButton label="Coret" active={state?.strike} disabled={!editor} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolButton>
      </div>
      <div className="rich-text-tool-group">
        <ToolButton label="Daftar bullet" active={state?.bullet} disabled={!editor} onClick={() => editor.chain().focus().toggleBulletList().run()}>• ≡</ToolButton>
        <ToolButton label="Daftar bernomor" active={state?.ordered} disabled={!editor} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. ≡</ToolButton>
        <ToolButton label="Kutipan" active={state?.quote} disabled={!editor} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolButton>
      </div>
      <div className="rich-text-tool-group">
        <ToolButton label="Rata kiri" active={state?.left} disabled={!editor} onClick={() => editor.chain().focus().setTextAlign('left').run()}>☰</ToolButton>
        <ToolButton label="Rata tengah" active={state?.center} disabled={!editor} onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</ToolButton>
        <ToolButton label="Rata kanan" active={state?.right} disabled={!editor} onClick={() => editor.chain().focus().setTextAlign('right').run()}>☷</ToolButton>
      </div>
      <div className="rich-text-tool-group">
        <ToolButton label="Tambah atau ubah tautan" active={state?.link} disabled={!editor} onClick={openLink}>Tautan</ToolButton>
        {state?.link && <ToolButton label="Hapus tautan" disabled={!editor} onClick={() => editor.chain().focus().unsetLink().run()}>Lepas</ToolButton>}
      </div>
      <div className="rich-text-tool-group">
        <ToolButton label="Urungkan" title="Urungkan (Ctrl/Cmd+Z)" disabled={!state?.canUndo} onClick={() => editor.chain().focus().undo().run()}>↶</ToolButton>
        <ToolButton label="Ulangi" title="Ulangi (Ctrl/Cmd+Shift+Z)" disabled={!state?.canRedo} onClick={() => editor.chain().focus().redo().run()}>↷</ToolButton>
      </div>
    </div>
    {linkOpen && <div className="rich-text-link-panel"><label htmlFor="product-description-link">Alamat tautan</label><input id="product-description-link" type="url" autoFocus placeholder="https://contoh.com" value={linkUrl} onChange={event => setLinkUrl(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); saveLink(); } if (event.key === 'Escape') setLinkOpen(false); }} /><button type="button" onClick={saveLink}>Terapkan</button><button type="button" onClick={() => setLinkOpen(false)}>Batal</button>{linkError && <span role="alert">{linkError}</span>}</div>}
    <EditorContent editor={editor} className="rich-text-content" />
    <div className="rich-text-footer"><span>Tulis deskripsi dan pilih format dari toolbar.</span><span>{state?.words || 0} kata</span></div>
  </div>;
}
