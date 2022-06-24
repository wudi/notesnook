var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Button, Flex } from "rebass";
import { useCallback, useRef, useState } from "react";
import { SplitButton } from "../components/split-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
import { PopupWrapper } from "../../components/popup-presenter";
import React from "react";
function _ListTool(props) {
    var editor = props.editor, onClick = props.onClick, isActive = props.isActive, subTypes = props.subTypes, type = props.type, toolProps = __rest(props, ["editor", "onClick", "isActive", "subTypes", "type"]);
    var toolbarLocation = useToolbarLocation();
    var isBottom = toolbarLocation === "bottom";
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = useRef();
    return (_jsx(SplitButton, __assign({}, toolProps, { buttonRef: buttonRef, onClick: onClick, toggled: isActive || isOpen, sx: { mr: 0 }, onOpen: function () { return setIsOpen(function (s) { return !s; }); } }, { children: _jsx(PopupWrapper, { isOpen: isOpen, group: "lists", id: toolProps.title, blocking: false, focusOnRender: false, position: {
                isTargetAbsolute: true,
                target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
                align: "center",
                location: isBottom ? "top" : "below",
                yOffset: isBottom ? 10 : 5,
            }, onClosed: function () { return setIsOpen(false); }, renderPopup: function () { return (_jsx(Box, __assign({ sx: {
                    bg: "background",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    p: 1,
                } }, { children: subTypes.map(function (item) { return (_jsx(Button, __assign({ variant: "menuitem", sx: { width: 80 }, onClick: function () {
                        var _a;
                        var chain = (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus();
                        if (!chain)
                            return;
                        if (!isActive) {
                            if (type === "bulletList")
                                chain = chain.toggleBulletList();
                            else
                                chain = chain.toggleOrderedList();
                        }
                        return chain
                            .updateAttributes(type, { listType: item.type })
                            .run();
                    } }, { children: _jsx(ListThumbnail, { listStyleType: item.type }) }), item.title)); }) }))); } }) })));
}
var ListTool = React.memo(_ListTool, function (prev, next) {
    return prev.isActive === next.isActive;
});
export function NumberedList(props) {
    var editor = props.editor;
    var onClick = useCallback(function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleOrderedList().run(); }, []);
    return (_jsx(ListTool, __assign({}, props, { type: "orderedList", isActive: editor.isActive("orderedList"), onClick: onClick, subTypes: [
            { type: "decimal", title: "Decimal", items: ["1", "2", "3"] },
            { type: "upper-alpha", title: "Upper alpha", items: ["A", "B", "C"] },
            { type: "lower-alpha", title: "Lower alpha", items: ["a", "b", "c"] },
            {
                type: "upper-roman",
                title: "Upper Roman",
                items: ["I", "II", "III"],
            },
            {
                type: "lower-roman",
                title: "Lower Roman",
                items: ["i", "ii", "iii"],
            },
            { type: "lower-greek", title: "Lower Greek", items: ["α", "β", "γ"] },
        ] })));
}
export function BulletList(props) {
    var editor = props.editor;
    var onClick = useCallback(function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleOrderedList().run(); }, []);
    return (_jsx(ListTool, __assign({}, props, { type: "bulletList", onClick: onClick, isActive: editor.isActive("bulletList"), subTypes: [
            { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
            { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
            { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
        ] })));
}
function ListThumbnail(props) {
    var listStyleType = props.listStyleType;
    return (_jsx(Flex, __assign({ as: "ul", sx: {
            flexDirection: "column",
            flex: 1,
            p: 0,
            listStyleType: listStyleType,
        } }, { children: [0, 1, 2].map(function (i) { return (_jsx(Box, __assign({ as: "li", sx: {
                display: "list-item",
                color: "text",
                fontSize: 8,
                mb: "1px",
            } }, { children: _jsx(Flex, __assign({ sx: {
                    alignItems: "center",
                } }, { children: _jsx(Box, { sx: {
                        width: "100%",
                        flexShrink: 0,
                        height: 4,
                        bg: "#cbcbcb",
                        borderRadius: "small",
                    } }) })) }), i.toString())); }) })));
}
