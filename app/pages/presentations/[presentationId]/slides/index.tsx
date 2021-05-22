import { Suspense, useCallback, useEffect } from "react"
import {
  Head,
  Link,
  usePaginatedQuery,
  useRouter,
  useParam,
  BlitzPage,
  Routes,
  useQuery,
} from "blitz"
import styled from "styled-components"
import ReactMarkdown from "react-markdown"
import SyntaxHighlighter from "react-syntax-highlighter"
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs"
import Layout from "app/core/layouts/Layout"
import getSlides from "app/slides/queries/getSlides"
import getPresentation from "app/presentations/queries/getPresentation"
import { Breadcrumb } from "app/core/components/Ui"
import { Scrollable } from "app/core/components/Icons"

const ITEMS_PER_PAGE = 1

const components = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "")
    return !inline && match ? (
      <CodeBlock style={githubGist} language={match[1]} PreTag="div" {...props}>
        {String(children).replace(/\n$/, "")}
      </CodeBlock>
    ) : (
      <Code className={className} {...props}>
        {children}
      </Code>
    )
  },
}

const CodeBlock = styled(SyntaxHighlighter)`
  margin: 25px 0px;
  font-size: 16px;

  font-size: 16px;
`

const Code = styled.code`
  background-color: #f5f4f4;
  padding: 6px;
  border-radius: 4px;
  font-size: 14px;
`

export const SlidesList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const presentationId = useParam("presentationId", "number")
  const [{ slides, hasMore }] = usePaginatedQuery(getSlides, {
    where: { presentation: { id: presentationId } },
    orderBy: { number: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () =>
    router.push({ query: { presentationId: presentationId, page: page - 1 } })
  const goToNextPage = () =>
    router.push({ query: { presentationId: presentationId, page: page + 1 } })

  const onKeydown = useCallback(
    (event) => {
      if (hasMore && (event.key === "ArrowRight" || event.key === "Enter")) {
        goToNextPage()
      } else if (page !== 0 && (event.key === "ArrowLeft" || event.key === "Backspace")) {
        goToPreviousPage()
      }
    },
    [hasMore, page]
  )

  useEffect(() => {
    document.addEventListener("keydown", onKeydown, false)

    return () => {
      document.removeEventListener("keydown", onKeydown, false)
    }
  }, [hasMore, page])

  return (
    <div>
      {slides.map((slide) => (
        <Slide key={slide.id}>
          <ReactMarkdown components={components} children={slide.text} />
        </Slide>
      ))}

      <Buttons>
        <button disabled={page === 0} onClick={goToPreviousPage}>
          Previous
        </button>
        <button disabled={!hasMore} onClick={goToNextPage}>
          Next
        </button>
      </Buttons>
    </div>
  )
}

const Slide = styled.div`
  img {
    margin: 20px 0px;
    max-width: 800px;
  }

  ul {
    padding-inline-start: 30px;
    list-style: disc;
  }

  li {
    padding: 10px 0px;
  }

  p {
    margin: 10px;
  }
`

const Buttons = styled.div`
  margin-top: 35px;

  button:not(:last-child) {
    margin-right: 8px;
  }
`

const Breadcrumbs = () => {
  const presentationId = useParam("presentationId", "number")
  const [presentation] = useQuery(getPresentation, { id: presentationId })
  const router = useRouter()
  const page = Number(router.query.page) || 0

  const [slides] = useQuery(getSlides, {
    where: {
      presentationId: presentationId,
    },
  })

  return (
    <Breadcrumb>
      <p>
        <Link href={Routes.Home()}>
          <a>
            <Scrollable />
          </a>
        </Link>
      </p>
      <p>
        <Link href={Routes.PresentationsPage()}>
          <a>Presentations</a>
        </Link>
      </p>
      {presentationId && (
        <p>
          <Link href={Routes.ShowPresentationPage({ presentationId: presentationId })}>
            <a>{presentation.title}</a>
          </Link>
        </p>
      )}
      <p>
        {page + 1}/{slides.count}
      </p>
    </Breadcrumb>
  )
}

const Header = () => {
  const presentationId = useParam("presentationId", "number")
  const router = useRouter()
  const page = Number(router.query.page) || 0

  const [slides] = useQuery(getSlides, {
    where: {
      presentationId: presentationId,
    },
  })

  return (
    <Head>
      <title>
        {page + 1}/{slides.count} | scrollable
      </title>
    </Head>
  )
}

const SlidesPage: BlitzPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>

      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <Breadcrumbs />
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          <SlidesList />
        </Suspense>
      </div>
    </>
  )
}

SlidesPage.authenticate = true
SlidesPage.getLayout = (page) => <Layout>{page}</Layout>

export default SlidesPage
