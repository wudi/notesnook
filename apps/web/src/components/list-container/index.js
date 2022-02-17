import { useMemo, useRef, useState } from "react";
import { Flex, Button } from "rebass";
import * as Icon from "../icons";
import { Virtuoso } from "react-virtuoso";
import {
  useStore as useSelectionStore,
  store as selectionStore,
} from "../../stores/selection-store";
import GroupHeader from "../group-header";
import ListProfiles from "../../common/list-profiles";
import { CustomScrollbarsVirtualList } from "../scroll-container";
import ReminderBar from "../reminder-bar";
import Announcements from "../announcements";
import useAnnouncements from "../../utils/use-announcements";

function ListContainer(props) {
  const { type, groupType, items, context, refresh, header } = props;

  const [focusedGroupIndex, setFocusedGroupIndex] = useState(-1);

  const [announcements, removeAnnouncement] = useAnnouncements();
  const profile = useMemo(() => ListProfiles[type], [type]);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const listRef = useRef();
  const focusedItemIndex = useRef(-1);
  const listContainerRef = useRef();
  const groups = useMemo(
    () => props.items.filter((v) => v.type === "header"),
    [props.items]
  );

  return (
    <Flex variant="columnFill">
      {!props.items.length && props.placeholder ? (
        <>
          {header}
          <ReminderBar />
          <Flex variant="columnCenterFill">
            {props.isLoading ? <Icon.Loading rotate /> : <props.placeholder />}
          </Flex>
        </>
      ) : (
        <>
          <Flex
            ref={listContainerRef}
            variant="columnFill"
            data-test-id="note-list"
            onFocus={(e) => {
              if (e.target.parentElement.dataset.index) {
                focusedItemIndex.current = parseInt(
                  e.target.parentElement.dataset.index
                );
              }
            }}
          >
            <Virtuoso
              ref={listRef}
              data={items}
              computeItemKey={(index) => items[index].id || items[index].title}
              defaultItemHeight={profile.estimatedItemHeight}
              totalCount={items.length}
              onMouseDown={(e) => {
                const listItem = e.target.closest(`[data-item-index]`);
                if (e.shiftKey && listItem) {
                  e.preventDefault();
                  const endIndex = parseInt(listItem.dataset.index);
                  if (isNaN(endIndex)) return;
                  setSelectedItems([
                    ...selectionStore.get().selectedItems,
                    ...items.slice(focusedItemIndex.current, endIndex + 1),
                  ]);
                  listItem.firstElementChild.focus();
                }
              }}
              onBlur={() => setFocusedGroupIndex(-1)}
              onKeyDown={(e) => {
                if (e.code === "Escape") {
                  selectionStore.toggleSelectionMode(false);
                  return;
                }

                if (e.code === "KeyA" && e.ctrlKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedItems(
                    items.filter((item) => item.type !== "header")
                  );
                  return;
                }

                // const isShiftKey = e.shiftKey;
                const isUp = e.code === "ArrowUp";
                const isDown = e.code === "ArrowDown";
                const isHeader = (i) => items && items[i]?.type === "header";
                const moveDown = (i) =>
                  i < items.length - 1 ? ++i : items.length - 1;
                const moveUp = (i) => (i > 0 ? --i : 0);

                let i = focusedItemIndex.current;
                let nextIndex = i;

                if (nextIndex <= -1 && (isUp || isDown)) {
                  nextIndex = 0;
                }

                if (isUp) {
                  nextIndex = moveUp(i);
                  if (isHeader(nextIndex)) nextIndex = moveUp(nextIndex);
                } else if (isDown) {
                  nextIndex = moveDown(i);
                  if (isHeader(nextIndex)) nextIndex = moveDown(nextIndex);
                }

                if (isUp || isDown) {
                  e.preventDefault();

                  listRef.current.scrollIntoView({
                    index: nextIndex,
                    behavior: "auto",
                    done: () => {
                      const query = `[data-item-index="${nextIndex}"]`;
                      const listItem = document.querySelector(query);
                      if (!listItem) return;
                      listItem.firstElementChild.focus();
                    },
                  });
                  selectionStore.toggleSelectionMode(false);
                  // if (isShiftKey) {
                  //   const isUp = nextIndex < i; // ? "up" : "down";
                  //   const isBefore = nextIndex < anchorIndex.current; // ? "before" : "after";
                  //   let isSelect = isBefore ? isUp : !isUp;
                  //   const selectedItems = selectionStore
                  //     .get()
                  //     .selectedItems.slice();

                  //   if (isSelect && nextIndex === anchorIndex.current) {
                  //     isSelect = false;
                  //   }

                  //   if (isSelect) selectedItems.push(items[nextIndex]);
                  //   else {
                  //     const indexOfItem = selectedItems.indexOf(items[i]);
                  //     if (indexOfItem <= -1) return;
                  //     selectedItems.splice(indexOfItem, 1);
                  //   }
                  //   setSelectedItems(selectedItems);
                  // } else {
                  //   setSelectedItems([items[nextIndex]]);
                  //   // selectionStore.toggleSelectionMode(false);
                  // }
                }
              }}
              // overscan={10}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Header: () =>
                  header ? (
                    header
                  ) : announcements.length ? (
                    <Announcements
                      announcements={announcements}
                      removeAnnouncement={removeAnnouncement}
                    />
                  ) : (
                    <ReminderBar />
                  ),
              }}
              itemContent={(index, item) => {
                if (!item) return null;

                switch (item.type) {
                  case "header":
                    return (
                      <GroupHeader
                        type={groupType}
                        refresh={refresh}
                        title={item.title}
                        isFocused={index === focusedGroupIndex}
                        index={index}
                        onSelectGroup={() => {
                          let endIndex;
                          for (let i = index + 1; i < props.items.length; ++i) {
                            if (props.items[i].type === "header") {
                              endIndex = i;
                              break;
                            }
                          }
                          setSelectedItems([
                            ...selectionStore.get().selectedItems,
                            ...props.items.slice(
                              index,
                              endIndex || props.items.length
                            ),
                          ]);
                        }}
                        groups={groups}
                        onJump={(title) => {
                          const index = props.items.findIndex(
                            (v) => v.title === title
                          );
                          if (index < 0) return;
                          listRef.current.scrollToIndex({
                            index,
                            align: "center",
                            behavior: "auto",
                          });
                          setFocusedGroupIndex(index);
                        }}
                      />
                    );
                  default:
                    return profile.item(index, item, groupType, context);
                }
              }}
            />
          </Flex>
        </>
      )}
      {props.button && (
        <Button
          variant="primary"
          testId={`${props.type}-action-button`}
          onClick={props.button.onClick}
          sx={{
            display: ["block", "block", "none"],
            alignSelf: "end",
            borderRadius: 100,
            p: 0,
            m: 0,
            mb: 2,
            mr: 2,
            width: 45,
            height: 45,
          }}
        >
          <Icon.Plus color="static" />
        </Button>
      )}
    </Flex>
  );
}
export default ListContainer;
