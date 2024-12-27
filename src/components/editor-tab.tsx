import CodeMirror, { EditorSelection, EditorView } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { githubDark } from "@uiw/codemirror-theme-github";
import { lintGutter } from "@codemirror/lint";
import { mdModelsLinter } from "@/lib/lint";
import { memo, useRef, useCallback } from "react";
import { useCode, useValidatorStore } from "@/lib/stores/validator-store";
import { indentedLineWrap } from "@/lib/editor-utils";
import { useEditorStore } from "@/lib/stores/editor-store";

const themeExtension = {
  ".indented-wrapped-line": {
    borderLeft: "transparent solid calc(var(--indented))",
  },
  ".indented-wrapped-line:before": {
    content: '""',
    marginLeft: "calc(-1 * var(--indented))",
  },
  ".cm-gutters, .cm-activeLineGutter": {
    background: "transparent",
  },
};

export const editorExtensions = [
  markdown(),
  mdModelsLinter,
  EditorView.lineWrapping,
  EditorView.theme({
    ".cm-gutters": {
      backgroundColor: "#0D1117",
    },
    ".cm-lineNumbers": {
      color: "#484F58",
    },
    ...themeExtension,
  }),
  indentedLineWrap,
  lintGutter(),
];

const editorExtensionsWithoutGutter = editorExtensions.slice(0, 5);

interface EditorTabProps {
  height?: string;
  width?: string;
  className?: string;
  jumpToLine?: number;
  useLineGutter?: boolean;
  setCodeAlt?: (value: string) => void;
  readonly?: boolean;
  code?: string;
  isMain?: boolean;
}

export const EditorTab = memo(function EditorTab({
  height = "100%",
  width = "100%",
  className,
  jumpToLine,
  useLineGutter = true,
  setCodeAlt,
  readonly = false,
  code,
  isMain = false,
}: EditorTabProps) {
  const globalCode = useCode();
  const displayCode = code ?? globalCode;
  const setCode = useValidatorStore((state) => state.setCode);
  const editorRef = useRef<EditorView | null>(null);

  if (isMain) {
    useEditorStore.setState({ editorRef });
  }

  const handleChange = useCallback(
    (value: string) => {
      if (setCodeAlt) {
        setCodeAlt(value);
      } else {
        setCode(value);
      }
    },
    [setCode, setCodeAlt]
  );

  const handleEditorCreate = useCallback(
    (view: EditorView) => {
      if (jumpToLine !== undefined) {
        const line = view.state.doc.line(jumpToLine);
        view.dispatch({
          selection: EditorSelection.single(line.from, line.from),
          effects: EditorView.scrollIntoView(line.from, { y: "start" }),
        });
      }
    },
    [jumpToLine]
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={displayCode}
      height={height}
      width={width}
      theme={githubDark}
      extensions={
        useLineGutter ? editorExtensions : editorExtensionsWithoutGutter
      }
      onChange={handleChange}
      className={className}
      onCreateEditor={handleEditorCreate}
      editable={!readonly}
      basicSetup={{
        lineNumbers: useLineGutter,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: false,
      }}
    />
  );
});
