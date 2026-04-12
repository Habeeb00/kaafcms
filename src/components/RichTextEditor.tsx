'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. when loading edit mode)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const ToolbarBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button type="button" className={`tiptap-btn ${active ? 'active' : ''}`} onClick={onClick} title={title}>
      {children}
    </button>
  );

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarBtn>
        <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarBtn>
        <ToolbarBtn title="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolbarBtn>
        <ToolbarBtn title="Inline Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{'<>'}</ToolbarBtn>
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
        <ToolbarBtn title="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarBtn>
        <ToolbarBtn title="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
        <ToolbarBtn title="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
        <ToolbarBtn title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarBtn>
        <ToolbarBtn title="Ordered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarBtn>
        <ToolbarBtn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarBtn>
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
        <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
