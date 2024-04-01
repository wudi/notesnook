/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Button, Flex, Text } from "@theme-ui/components";
import { useState } from "react";
import {
  Cross,
  EditorFullWidth,
  EditorNormalWidth,
  ExitFullscreen,
  FocusMode,
  Fullscreen,
  Lock,
  NormalMode,
  Note,
  Pin,
  Properties,
  Readonly,
  Search,
  TableOfContents,
  Trash,
  Unlock,
  WindowClose,
  WindowMaximize,
  WindowMinimize,
  WindowRestore
} from "../icons";
import { ScrollContainer } from "@notesnook/ui";
import {
  SessionType,
  isLockedSession,
  useEditorStore
} from "../../stores/editor-store";
import { Menu } from "../../hooks/use-menu";
import { useStore as useAppStore } from "../../stores/app-store";
import { useEditorManager } from "./manager";
import {
  closestCenter,
  DndContext,
  useSensor,
  useSensors,
  KeyboardSensor,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { desktop } from "../../common/desktop-bridge";
import { useWindowControls } from "../../hooks/use-window-controls";
import { ScopedThemeProvider } from "../theme-provider";
import { getPlatform } from "../../utils/platform";

export function EditorActionBar() {
  const editorMargins = useEditorStore((store) => store.editorMargins);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const { isMaximized, isFullscreen, hasNativeWindowControls } =
    useWindowControls();
  const activeSession = useEditorStore((store) =>
    store.activeSessionId ? store.getSession(store.activeSessionId) : undefined
  );
  const editor = useEditorManager((store) =>
    activeSession?.id ? store.editors[activeSession?.id]?.editor : undefined
  );

  const tools = [
    {
      title: editorMargins ? "Disable editor margins" : "Enable editor margins",
      icon: editorMargins ? EditorNormalWidth : EditorFullWidth,
      enabled: true,
      onClick: () => useEditorStore.getState().toggleEditorMargins()
    },
    {
      title: isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
      icon: isFullscreen ? ExitFullscreen : Fullscreen,
      enabled: true,
      hidden: !isFocusMode,
      hideOnMobile: true,
      onClick: () => {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen(document.documentElement);
        }
      }
    },
    {
      title: isFocusMode ? "Normal mode" : "Focus mode",
      icon: isFocusMode ? FocusMode : NormalMode,
      enabled: true,
      hideOnMobile: true,
      onClick: () => {
        useAppStore.getState().toggleFocusMode();
        if (document.fullscreenElement) exitFullscreen();
        const id = useEditorStore.getState().activeSessionId;
        const editor = id && useEditorManager.getState().getEditor(id);
        if (editor) editor.editor?.focus();
      }
    },
    {
      title: "Table of contents",
      icon: TableOfContents,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "diff" &&
        activeSession.type !== "conflicted",
      onClick: () => useEditorStore.getState().toggleTableOfContents()
    },
    {
      title: "Search",
      icon: Search,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "readonly" &&
        activeSession.type !== "diff" &&
        activeSession.type !== "conflicted",
      onClick: editor?.startSearch
    },
    {
      title: "Properties",
      icon: Properties,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "diff" &&
        activeSession.type !== "conflicted" &&
        !isFocusMode,
      onClick: () => useEditorStore.getState().toggleProperties()
    },

    {
      title: "Minimize",
      icon: WindowMinimize,
      hidden: hasNativeWindowControls || isFullscreen,
      enabled: true,
      onClick: () => desktop?.window.minimze.mutate()
    },
    {
      title: isMaximized ? "Restore" : "Maximize",
      icon: isMaximized ? WindowRestore : WindowMaximize,
      enabled: true,
      hidden: hasNativeWindowControls || isFullscreen,
      onClick: () =>
        isMaximized
          ? desktop?.window.restore.mutate()
          : desktop?.window.maximize.mutate()
    },
    {
      title: "Close",
      icon: WindowClose,
      hidden: hasNativeWindowControls || isFullscreen,
      enabled: true,
      onClick: () => window.close()
    }
  ];

  return (
    <ScopedThemeProvider scope="titleBar" injectCssVars>
      <Flex
        sx={{
          gap: 2,
          borderBottom: "1px solid var(--border)",
          px: 1,
          ...(IS_DESKTOP_APP && !isFullscreen && hasNativeWindowControls
            ? getPlatform() === "darwin"
              ? { pl: "calc(100vw - env(titlebar-area-width))" }
              : { pr: "calc(100vw - env(titlebar-area-width))" }
            : {})
        }}
      >
        {IS_DESKTOP_APP ? (
          getPlatform() === "darwin" && !isFullscreen ? null : (
            <svg
              className="titlebarLogo"
              style={{
                alignSelf: "center",
                height: 24,
                width: 24
              }}
            >
              <use href="#themed-logo" />
            </svg>
          )
        ) : null}
        <TabStrip />
        <Flex
          bg="transparent"
          sx={{
            // borderRadius: "default",
            // overflow: "hidden",
            alignItems: "center",
            justifyContent: "flex-end"
            // mr: IS_DESKTOP_APP ? `calc(100vw - env(titlebar-area-width))` : 2
          }}
        >
          {tools.map((tool) => (
            <Button
              data-test-id={tool.title}
              disabled={!tool.enabled}
              variant={tool.title === "Close" ? "error" : "secondary"}
              title={tool.title}
              key={tool.title}
              sx={{
                height: "100%",
                alignItems: "center",
                bg: "transparent",
                display: [
                  tool.hideOnMobile ? "none" : "flex",
                  tool.hidden ? "none" : "flex"
                ],
                borderRadius: 0,
                flexShrink: 0,
                "&:hover svg path": {
                  fill:
                    tool.title === "Close"
                      ? "var(--accentForeground-error) !important"
                      : "var(--icon)"
                }
              }}
              onClick={tool.onClick}
            >
              <tool.icon size={18} />
            </Button>
          ))}
        </Flex>
      </Flex>
    </ScopedThemeProvider>
  );
}

function TabStrip() {
  const sessions = useEditorStore((store) => store.sessions);
  const activeSessionId = useEditorStore((store) => store.activeSessionId);

  return (
    <ScrollContainer
      className="tabsScroll"
      suppressScrollY
      style={{ flex: 1 }}
      trackStyle={() => ({
        backgroundColor: "transparent",
        pointerEvents: "none"
      })}
      thumbStyle={() => ({ height: 3 })}
      onWheel={(e) => {
        const scrollcontainer = document.querySelector(".tabsScroll");
        if (!scrollcontainer) return;
        if (e.deltaY > 0) scrollcontainer.scrollLeft += 100;
        else if (e.deltaY < 0) scrollcontainer.scrollLeft -= 100;
      }}
    >
      <Flex
        sx={{
          flex: 1,
          my: "2.5px",
          gap: 1,
          height: 32
        }}
        onDoubleClick={async (e) => {
          e.stopPropagation();
          useEditorStore.getState().newSession();
        }}
      >
        <ReorderableList
          items={sessions}
          moveItem={(from, to) => {
            if (from === to) return;
            useEditorStore.setState((state) => {
              const isToPinned = state.sessions[to].pinned;
              const [fromTab] = state.sessions.splice(from, 1);

              // if the tab where this tab is being dropped is pinned,
              // let's pin our tab too.
              if (isToPinned) {
                fromTab.pinned = true;
                fromTab.preview = false;
              }
              // unpin the tab if it is moved.
              else if (fromTab.pinned) fromTab.pinned = false;

              state.sessions.splice(to, 0, fromTab);
            });
          }}
          renderItem={({ item: session, index: i }) => (
            <Tab
              id={session.id}
              key={session.id}
              title={
                session.title ||
                ("note" in session ? session.note.title : "Untitled")
              }
              isTemporary={!!session.preview}
              isActive={session.id === activeSessionId}
              isPinned={!!session.pinned}
              isLocked={isLockedSession(session)}
              type={session.type}
              onKeepOpen={() =>
                useEditorStore
                  .getState()
                  .updateSession(
                    session.id,
                    [session.type],
                    (s) => (s.preview = false)
                  )
              }
              onFocus={() => {
                if (session.id !== activeSessionId) {
                  useEditorStore.getState().openSession(session.id);
                }
              }}
              onClose={() =>
                useEditorStore.getState().closeSessions(session.id)
              }
              onCloseAll={() =>
                useEditorStore
                  .getState()
                  .closeSessions(
                    ...sessions.filter((s) => !s.pinned).map((s) => s.id)
                  )
              }
              onCloseOthers={() =>
                useEditorStore
                  .getState()
                  .closeSessions(
                    ...sessions
                      .filter((s) => s.id !== session.id && !s.pinned)
                      .map((s) => s.id)
                  )
              }
              onCloseToTheRight={() =>
                useEditorStore
                  .getState()
                  .closeSessions(
                    ...sessions
                      .filter((s, index) => index > i && !s.pinned)
                      .map((s) => s.id)
                  )
              }
              onCloseToTheLeft={() =>
                useEditorStore
                  .getState()
                  .closeSessions(
                    ...sessions
                      .filter((s, index) => index < i && !s.pinned)
                      .map((s) => s.id)
                  )
              }
              onRevealInList={() =>
                AppEventManager.publish(
                  AppEvents.revealItemInList,
                  "note" in session ? session.note.id : session.id,
                  true
                )
              }
              onPin={() => {
                useEditorStore.setState((state) => {
                  // preview tabs can never be pinned.
                  if (!session.pinned) state.sessions[i].preview = false;
                  state.sessions[i].pinned = !session.pinned;
                  state.sessions.sort((a, b) =>
                    a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1
                  );
                });
              }}
            />
          )}
        />
      </Flex>
    </ScrollContainer>
  );
}

type TabProps = {
  id: string;
  title: string;
  isActive: boolean;
  isTemporary: boolean;
  isPinned: boolean;
  isLocked: boolean;
  type: SessionType;
  onKeepOpen: () => void;
  onFocus: () => void;
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseToTheRight: () => void;
  onCloseToTheLeft: () => void;
  onCloseAll: () => void;
  onRevealInList: () => void;
  onPin: () => void;
};
function Tab(props: TabProps) {
  const {
    id,
    title,
    isActive,
    isTemporary,
    isPinned,
    isLocked,
    type,
    onKeepOpen,
    onFocus,
    onClose,
    onCloseAll,
    onCloseOthers,
    onCloseToTheRight,
    onCloseToTheLeft,
    onRevealInList,
    onPin
  } = props;
  const Icon = isLocked
    ? type === "locked"
      ? Lock
      : Unlock
    : type === "readonly"
    ? Readonly
    : type === "deleted"
    ? Trash
    : Note;
  const { attributes, listeners, setNodeRef, transform, transition, active } =
    useSortable({ id });

  return (
    <Flex
      ref={setNodeRef}
      className="tab"
      sx={{
        borderRadius: "default",
        cursor: "pointer",
        px: 2,
        py: "7px",

        transform: CSS.Transform.toString(transform),
        transition,
        visibility: active?.id === id ? "hidden" : "visible",

        bg: isActive ? "background-selected" : "background-secondary",
        // borderTopLeftRadius: "default",
        // borderTopRightRadius: "default",
        // borderBottom: isActive ? "none" : "1px solid var(--border)",
        border: "1px solid",
        borderColor: isActive ? "border-selected" : "transparent",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        ":hover": {
          "& .closeTabButton": {
            visibility: "visible"
          },
          bg: isActive ? "hover-selected" : "hover"
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        Menu.openMenu([
          { type: "button", title: "Close", key: "close", onClick: onClose },
          {
            type: "button",
            title: "Close others",
            key: "close-others",
            onClick: onCloseOthers
          },
          {
            type: "button",
            title: "Close to the right",
            key: "close-to-the-right",
            onClick: onCloseToTheRight
          },
          {
            type: "button",
            title: "Close to the left",
            key: "close-to-the-left",
            onClick: onCloseToTheLeft
          },
          {
            type: "button",
            title: "Close all",
            key: "close-all",
            onClick: onCloseAll
          },
          { type: "separator", key: "sep" },
          {
            type: "button",
            title: "Reveal in list",
            key: "reveal-in-list",
            onClick: onRevealInList
          },
          { type: "separator", key: "sep" },
          {
            type: "button",
            key: "keep-open",
            title: "Keep open",
            onClick: onKeepOpen,
            isDisabled: !isTemporary
          },
          {
            type: "button",
            key: "pin",
            title: "Pin",
            onClick: onPin,
            isChecked: isPinned,
            icon: Pin.path
          }
        ]);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isTemporary) onKeepOpen();
      }}
      onAuxClick={(e) => {
        if (e.button == 1) onClose();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      {...listeners}
      {...attributes}
    >
      <Flex mr={1}>
        <Icon size={16} color={isActive ? "accent-selected" : "icon"} />
        <Text
          variant="body"
          sx={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflowX: "hidden",
            pointerEvents: "none",
            fontStyle: isTemporary ? "italic" : "normal",
            maxWidth: 120,
            color: isActive ? "paragraph-selected" : "paragraph"
          }}
          ml={1}
        >
          {title}
        </Text>
      </Flex>
      {isPinned ? (
        <Pin
          sx={{
            ":hover": { bg: "border" },
            borderRadius: "default",
            flexShrink: 0
          }}
          size={14}
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
        />
      ) : (
        <Cross
          sx={{
            visibility: isActive && active?.id !== id ? "visible" : "hidden",
            ":hover": { bg: "border" },
            borderRadius: "default",
            flexShrink: 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="closeTabButton"
          size={16}
        />
      )}
    </Flex>
  );
}

type ReorderableListProps<T> = {
  items: T[];
  renderItem: (props: { item: T; index: number }) => JSX.Element;
  moveItem: (from: number, to: number) => void;
};

function ReorderableList<T extends { id: string }>(
  props: ReorderableListProps<T>
) {
  const { items, renderItem: Item, moveItem } = props;
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const [activeItem, setActiveItem] = useState<T>();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // onDragCancel={(event) => {}}
      onDragStart={(event) => {
        setActiveItem(items.find((i) => i.id === event.active.id));
      }}
      onDragEnd={(event) => {
        const { active, over } = event;

        const overId = over?.id as string;
        if (overId && active.id !== overId) {
          const transitionItems = items.slice();
          const newIndex = transitionItems.findIndex((i) => i.id === overId);
          const oldIndex = transitionItems.findIndex((i) => i.id === active.id);
          moveItem(oldIndex, newIndex);
        }
        setActiveItem(undefined);
      }}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always }
      }}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {items.map((item, index) => (
          <Item key={item.id} item={item} index={index} />
        ))}

        <DragOverlay
          dropAnimation={{
            duration: 500,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
          }}
        >
          {activeItem && <Item item={activeItem} index={0} />}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
}

function enterFullscreen(elem: HTMLElement) {
  elem.requestFullscreen();
}

function exitFullscreen() {
  if (!document.fullscreenElement) return;
  document.exitFullscreen();
}
