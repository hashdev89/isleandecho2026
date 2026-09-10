'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link2,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code2,
  Eraser,
} from 'lucide-react'

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value.trim())
}

function toEditorHtml(value: string) {
  const raw = (value || '').trim()
  if (!raw) return '<p></p>'
  if (looksLikeHtml(raw)) return raw
  return raw
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        active ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function CmsRichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Write your content…',
  minHeightClass = 'min-h-[220px]',
}: {
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeightClass?: string
}) {
  const [showSource, setShowSource] = useState(false)
  const [sourceValue, setSourceValue] = useState(value || '')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-teal-700 underline' },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class: `cms-rich-editor prose prose-sm max-w-none focus:outline-none px-3 py-3 ${minHeightClass}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  useEffect(() => {
    if (!editor || showSource) return
    const current = editor.getHTML()
    const next = toEditorHtml(value)
    const normalize = (html: string) => (html === '<p></p>' ? '' : html)
    if (normalize(current) !== normalize(next)) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [value, editor, showSource])

  useEffect(() => {
    if (showSource) setSourceValue(value || '')
  }, [showSource, value])

  const setLink = () => {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previous || 'https://')
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
          <button
            type="button"
            onClick={() => {
              if (showSource && editor) {
                editor.commands.setContent(toEditorHtml(sourceValue), { emitUpdate: false })
                onChange(sourceValue.trim() ? sourceValue : '')
              }
              setShowSource((v) => !v)
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showSource ? 'Visual editor' : 'HTML source'}
          </button>
        </div>
      ) : null}

      {showSource ? (
        <textarea
          value={sourceValue}
          onChange={(e) => {
            setSourceValue(e.target.value)
            onChange(e.target.value)
          }}
          rows={12}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          placeholder="<p>Your HTML…</p>"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
            <ToolbarButton
              title="Bold"
              active={editor?.isActive('bold')}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={editor?.isActive('italic')}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              active={editor?.isActive('underline')}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Strikethrough"
              active={editor?.isActive('strike')}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolbarButton
              title="Heading 2"
              active={editor?.isActive('heading', { level: 2 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              active={editor?.isActive('heading', { level: 3 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Quote"
              active={editor?.isActive('blockquote')}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolbarButton
              title="Bullet list"
              active={editor?.isActive('bulletList')}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered list"
              active={editor?.isActive('orderedList')}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolbarButton
              title="Align left"
              active={editor?.isActive({ textAlign: 'left' })}
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Align center"
              active={editor?.isActive({ textAlign: 'center' })}
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Align right"
              active={editor?.isActive({ textAlign: 'right' })}
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolbarButton title="Add link" active={editor?.isActive('link')} onClick={setLink}>
              <Link2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Clear formatting"
              onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            >
              <Eraser className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolbarButton
              title="Undo"
              disabled={!editor?.can().undo()}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Redo"
              disabled={!editor?.can().redo()}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </div>
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}
