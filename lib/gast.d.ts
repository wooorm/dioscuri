/* eslint-disable @typescript-eslint/consistent-type-definitions, @typescript-eslint/ban-types */

import type {
  Parent as UnistParent,
  Literal as UnistLiteral,
  Node as UnistNode
} from 'unist'

export type Node = Root | Content

/**
 * This map registers all node types that may be used in a root.
 *
 * These types are accepted inside `root` nodes.
 *
 * This interface can be augmented to register custom node types.
 */
export interface RootContentMap {
  listItem: Break | Heading | Link | List | Pre | Quote | Text
}

/**
 * This map registers all node types that may be used in lists.
 *
 * These types are accepted inside `list` nodes.
 *
 * This interface can be augmented to register custom node types.
 */
export interface ListContentMap {
  listItem: ListItem
}

/**
 * Nodes allowed in parents.
 */
export type Content = RootContent | ListContent

/**
 * Nodes allowed in `root`.
 */
export type RootContent = RootContentMap[keyof RootContentMap]

/**
 * Nodes allowed in `list`.
 */
export type ListContent = ListContentMap[keyof ListContentMap]

/**
 * Nodes in gemini containing a value.
 */
export interface Literal extends UnistLiteral {
  /**
   * Literal value representing the value of a node.
   */
  value: string
}

/**
 * Node in gemini containing other nodes.
 */
export interface Parent extends UnistParent {
  /**
   * List representing the children of a node.
   */
  children: Content[]
}

/**
 * Represents a gemini root.
 */
export interface Root extends Parent {
  /**
   * Represents this variant of a parent.
   */
  type: 'root'

  /**
   * List representing the children of a node.
   */
  children: RootContent[]
}
/**
 * Represents a gemini list.
 */
export interface List extends Parent {
  /**
   * Represents this variant of a parent.
   */
  type: 'list'

  /**
   * List representing the children of a node.
   */
  children: ListContent[]
}

/**
 * Represents a gemini break.
 */
export interface Break extends UnistNode {
  /**
   * Represents this variant of a Node.
   */
  type: 'break'
}

/**
 * Represents a gemini text.
 */
export interface Quote extends Literal {
  /**
   * Represents this variant of a Literal.
   */
  type: 'quote'
}

/**
 * Represents a gemini text.
 */
export interface Text extends Literal {
  /**
   * Represents this variant of a Literal.
   */
  type: 'text'
}

/**
 * Represents a gemini list item.
 */
export interface ListItem extends Literal {
  /**
   * Represents this variant of a Literal.
   */
  type: 'listItem'
}

/**
 * Represents a gemini heading.
 */
export interface Heading extends Literal {
  /**
   * Represents this variant of a Literal.
   */
  type: 'heading'

  rank: 1 | 2 | 3
}

/**
 * Represents a gemini link.
 */
export interface Link extends Literal {
  /**
   * Represents this variant of a Literal.
   */
  type: 'link'

  /**
   * Place on the web.
   */
  url?: string | null | undefined
}

/**
 * Represents a gemini pre.
 */
export interface Pre extends Literal {
  /**
   * Represents this variant of a Literal.
   */
  type: 'pre'

  /**
   * Extra info.
   */
  alt?: string | null | undefined
}

/* eslint-enable @typescript-eslint/consistent-type-definitions, @typescript-eslint/ban-types */
