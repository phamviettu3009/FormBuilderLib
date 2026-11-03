import { createElement, type ElementType } from "react";

type AntdWapperProps = {
  child: ElementType;
  _invalid?: boolean;
  _errorMessage?: string;
  [propName: string]: unknown;
};

const AntdWapper = ({
  child,
  _invalid,
  _errorMessage,
  ...props
}: AntdWapperProps) =>
  createElement(child, {
    ...props,
    status: _invalid ? "error" : props.status,
  });

export default AntdWapper;