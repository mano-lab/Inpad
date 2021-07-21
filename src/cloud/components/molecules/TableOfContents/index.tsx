import utilToc, { TOCOptions } from 'mdast-util-toc'
import { Node } from 'unist'
import React, { useCallback } from 'react'
import unified from 'unified'
import remarkParse from 'remark-parse'
import rehypeSlug from 'rehype-slug'
import remarkStringify from 'remark-stringify'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { schema } from '../../atoms/MarkdownView'
import rehypeReact from 'rehype-react'
import { boostHubBaseUrl } from '../../../lib/consts'
import { usePage } from '../../../lib/stores/pageStore'
import { focusEditorHeadingEventEmitter } from '../../../lib/utils/events'

function tableOfContentsPlugin(options?: TOCOptions): (node: Node) => void {
  const settings = options || {}

  return transformer

  function transformer(node: any) {
    const result: any = utilToc(node, settings)

    if (!result.map) {
      return
    }
    node.children = [result.map]
  }
}

export function getTocFromContent(
  content: string,
  navigateOnClick: (heading: string) => void
): any {
  const rehypeReactConfig: any = {
    createElement: React.createElement,
    Fragment: React.Fragment,
    components: {
      a: ({ href, children }: any) => {
        if ((href || '').toLocaleLowerCase().startsWith('#')) {
          const headingName: string = href.substring(1)
          return (
            <a
              href={'#'}
              onClick={(e) => {
                e.preventDefault()
                navigateOnClick(headingName)
                return false
              }}
            >
              {children}
            </a>
          )
        }
        if (
          (href || '')
            .toLocaleLowerCase()
            .startsWith((boostHubBaseUrl || '').toLocaleLowerCase())
        ) {
          return <a href={href}>{children}</a>
        }
        return (
          <a href={href} target='_blank' rel='noopener noreferrer'>
            {children}
          </a>
        )
      },
    },
  }

  const newMarkdown = unified()
    .use(remarkParse)
    .use(rehypeSlug)
    .use(tableOfContentsPlugin)
    .use(remarkStringify)
    .processSync(content)

  const file = unified()
    .use(remarkParse)
    .use(remarkRehype, {
      allowDangerousHtml: true,
    })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeSanitize, schema)
    .use(rehypeReact, rehypeReactConfig)
    .processSync(newMarkdown)

  const tocContent = (file.result || file.toString()) as any
  return tocContent
}

interface TableOfContentsProps {
  content: string
}

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const { pageDoc, team } = usePage()

  const navigateToDocHeading = useCallback(
    (headingName) => {
      if (team != null && pageDoc != null) {
        focusEditorHeadingEventEmitter.dispatch({ heading: headingName })
      }
    },
    [pageDoc, team]
  )

  return (
    <div>
      {getTocFromContent(content, (heading) => navigateToDocHeading(heading))}
    </div>
  )
}
