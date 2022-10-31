import { ChevronDownIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { GetStaticPaths, GetStaticProps } from 'next'
import { QuerySnapshot, collection, getDocs } from 'firebase/firestore/lite'
import { checkTodayData, db } from '../../../utils/firebase'
import { convertDateToString, getPreviousDateString } from '../../../utils/util'
import { useMemo, useState } from 'react'

import { Badge } from '../../../components/Badge'
import { Disclosure } from '@headlessui/react'
import { DropdownMenu } from '../../../components/DropdownMenu'
import { FilterPopover } from '../../../components/FilterPopover'
import { Job } from '../../../types/Jobs'
import Link from 'next/link'
import { SkillType } from '../../../types/Skills'
import { categorizeSkills } from '../../../utils/analysis'
import { cities } from '../..'
import classNames from 'classnames'
import { mockJobs } from '../../../data/mockJobs'
import { useRouter } from 'next/router'

export const slugs = { 24: 'Within 24 hours', 48: '24-48 hours', 72: '48-72 hours' }
const sortByDropdownOptions = [
  'Sort By',
  'Company name (A-Z)',
  'Company name (Z-A)',
  '# of skills (High to Low)',
  '# of skills (Low to High)',
]

const getTimeElapsed = (createdAt: number) => {
  const now = new Date()
  const elapsed = Math.floor((now.getTime() - createdAt) / (1000 * 60 * 60))
  return elapsed < 1 ? 'within an hour' : `${elapsed} hours ago`
}

const getSkillCount = (job: Job) => {
  return Object.keys(job.skills)
    .filter((skill) => skill !== SkillType.LANGUAGE)
    .reduce((acc, cur) => acc + job.skills[cur].length, 0)
}

const sortJobs = (jobs: Job[], sortBy: string, filter: string[]) => {
  if (sortBy === 'Company name (A-Z)') {
    jobs = jobs.sort((a, b) => (a.company.toLowerCase() > b.company.toLowerCase() ? 1 : -1))
  } else if (sortBy === 'Company name (Z-A)') {
    jobs = jobs.sort((a, b) => (a.company.toLowerCase() < b.company.toLowerCase() ? 1 : -1))
  } else if (sortBy === '# of skills (High to Low)') {
    jobs = jobs.sort((a, b) => (getSkillCount(a) < getSkillCount(b) ? 1 : -1))
  } else if (sortBy === '# of skills (Low to High)') {
    jobs = jobs.sort((a, b) => (getSkillCount(a) < getSkillCount(b) ? -1 : 1))
  }
  // filter jobs by skills contained in filter
  if (filter.length > 0) {
    jobs = jobs.filter((job) => {
      const skills = Object.values(job.skills).flat()
      return filter.some((skill) => skills.includes(skill))
    })
  }
  return jobs
}

export default function JobPosts(props: { jobs: Job[] }) {
  const router = useRouter()
  const { city, slug } = router.query

  const [sortBy, setSortBy] = useState<string>('Sort By')
  const [filter, setFilter] = useState<string[]>([])
  const jobs = useMemo(
    () => sortJobs([...props.jobs], sortBy, filter),
    [props.jobs, sortBy, filter]
  )

  console.log('job post rerendered')

  const handleSkillBadgeClick = (skill: string) => {
    if (!filter.includes(skill)) setFilter([...filter, skill])
  }

  const handleCancelFilter = (skill: string) => {
    if (filter.includes(skill)) setFilter(filter.filter((s) => s !== skill))
  }

  return (
    <div>
      <ul className="flex flex-wrap text-sm font-medium sm:gap-2">
        {Object.keys(slugs).map((slugOption, i) => {
          const currentTab = slugOption === slug
          return (
            <li key={i}>
              <Link href={`/jobs/${city}/${slugOption}`}>
                <a
                  className={classNames(
                    {
                      'active border-cyan-600 text-cyan-600': currentTab,
                      'border-transparent hover:border-gray-300 hover:text-gray-600': !currentTab,
                    },
                    'inline-block cursor-pointer rounded-t-lg border-b-2 p-2.5'
                  )}
                >
                  {slugs[slugOption]}
                </a>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="my-2 flex w-full items-end justify-between">
        <FilterPopover skillBadgeCallBack={handleSkillBadgeClick}></FilterPopover>
        <DropdownMenu
          options={sortByDropdownOptions}
          selected={sortBy}
          onChangeCallback={setSortBy}
        ></DropdownMenu>
      </div>
      <div className="flex flex-wrap">
        {filter.map((skill, i) => (
          <Badge key={i} skill={skill} onClickCallBack={handleCancelFilter}>
            <XCircleIcon className="h-5 w-5"></XCircleIcon>
          </Badge>
        ))}
      </div>
      <div className="mt-3 mb-1 text-sm text-gray-500">{`Showing ${jobs.length} jobs${
        jobs.length ? ` (updated: ${getTimeElapsed(jobs[0].createdAt)})` : ''
      }`}</div>
      <div className="relative overflow-x-auto border border-gray-300 bg-gray-50 shadow-sm sm:rounded-lg">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th scope="col" className="py-3 px-10">
                Company & Role
              </th>
              <th scope="col" className="py-3 px-6">
                Languages
              </th>
              <th scope="col" className="py-3 px-6">
                Skills
              </th>
            </tr>
          </thead>
          <tbody>
            {!jobs.length && (
              <tr>
                <td colSpan={3} className="bg-white py-5 text-center">
                  No matching jobs found
                </td>
              </tr>
            )}
            {jobs.map((job, i) => {
              const { company, link, loc, remote, salary, skills, title } = job
              const evenRow = i % 2 === 0
              return (
                <Disclosure key={i}>
                  {({ open }) => (
                    <>
                      <tr
                        className={classNames({
                          'bg-white': evenRow,
                          'bg-gray-50': !evenRow,
                          'border-b shadow-sm': open,
                        })}
                      >
                        <td className="max-w-[10rem] py-2 px-3 sm:max-w-xs">
                          <Disclosure.Button className="flex max-w-full items-center gap-3">
                            <div>
                              <ChevronDownIcon
                                className={classNames(
                                  { 'rotate-180 transform': open },
                                  'h-4 w-4 text-gray-700'
                                )}
                              />
                            </div>
                            <div className="truncate whitespace-nowrap text-left font-medium text-cyan-600 hover:underline">
                              {company}
                              <div className="flex items-center">
                                {remote && <Badge>Remote</Badge>}
                                <p className="truncate whitespace-nowrap font-normal text-gray-900">
                                  {title}
                                </p>
                              </div>
                            </div>
                          </Disclosure.Button>
                        </td>
                        <td className="max-w-[18rem] py-2 px-6">
                          <div className="flex flex-wrap">
                            {Object.keys(skills).map((type) =>
                              skills[type].map(
                                (skill, i) =>
                                  type === SkillType.LANGUAGE && (
                                    <Badge
                                      key={i}
                                      skill={skill}
                                      onClickCallBack={handleSkillBadgeClick}
                                    />
                                  )
                              )
                            )}
                          </div>
                        </td>
                        <td className="max-w-[25rem] py-2 px-6">
                          <div className="flex flex-wrap">
                            {Object.keys(skills).map((type) =>
                              skills[type].map(
                                (skill, i) =>
                                  type !== SkillType.LANGUAGE && (
                                    <Badge
                                      key={i}
                                      skill={skill}
                                      onClickCallBack={handleSkillBadgeClick}
                                    />
                                  )
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3}>
                          <Disclosure.Panel
                            className={classNames(
                              {
                                'bg-white': evenRow,
                                'bg-gray-50': !evenRow,
                              },
                              'grid grid-cols-[9rem_minmax(0,_1fr)] border-b px-10 py-4 text-sm text-gray-500 shadow-sm sm:grid-cols-[19rem_minmax(0,_1fr)]'
                            )}
                          >
                            <div className="flex flex-col gap-1 text-base font-medium text-cyan-600">
                              {company}
                              <p className="text-gray-900">{title}</p>
                              <p className="text-sm font-normal text-gray-700">{loc}</p>
                              <p className="text-sm font-normal text-gray-700">
                                {salary || 'No salary estimation'}
                              </p>
                              <button
                                type="button"
                                className={classNames(
                                  {
                                    'bg-gray-50 hover:bg-gray-100': evenRow,
                                    'bg-gray-100 hover:bg-gray-200': !evenRow,
                                  },
                                  'w-24 rounded-md border border-gray-300  px-4 py-2 text-sm font-medium text-gray-700'
                                )}
                              >
                                <a href={link} target="_blank" rel="noreferrer">
                                  Job Post
                                </a>
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 text-base font-medium text-gray-900">
                              Skill Requirements
                              <div
                                className={classNames(
                                  {
                                    'bg-gray-50': evenRow,
                                    'bg-gray-100': !evenRow,
                                  },
                                  'flex h-full flex-col gap-2 rounded-md px-4 py-2 text-sm'
                                )}
                              >
                                {Object.keys(skills).map((type, i) =>
                                  skills[type].length ? (
                                    <p key={i}>
                                      {`${type}: `}
                                      <span className="font-normal">{skills[type].join(', ')}</span>
                                    </p>
                                  ) : null
                                )}
                              </div>
                            </div>
                          </Disclosure.Panel>
                        </td>
                      </tr>
                    </>
                  )}
                </Disclosure>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  // Get the paths we want to pre-render based on cities and times
  const paths = cities.flatMap(({ city }) =>
    Object.keys(slugs).map((slug) => ({
      params: { city, slug },
    }))
  )

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

// This also gets called at build time
export const getStaticProps: GetStaticProps = async (context) => {
  const { city, slug } = context.params
  let shiftDateBy = Number(slug) / 24 - 1

  // load mock data for development
  if (process.env.NODE_ENV === 'development') {
    const curatedMockData = mockJobs.map((mockJob) => {
      let { company, link, loc, remote, salary, skills, title } = mockJob
      return {
        company,
        createdAt: new Date().getTime(),
        link,
        loc,
        remote,
        salary,
        skills: categorizeSkills(skills),
        title,
      }
    })
    // make curatedMockData x times longer based on shiftDateBy to test pagination
    const mockData = Array.from({ length: shiftDateBy + 1 }, () => curatedMockData).flat()

    return { props: { jobs: mockData } }
  }

  // if jobs haven't been updated today, shift back by 1 day
  let dateStr = convertDateToString(new Date())
  const todayDataAvailable = await checkTodayData(city, dateStr)
  if (!todayDataAvailable) shiftDateBy += 1

  dateStr = getPreviousDateString(dateStr, shiftDateBy)

  const querySnapshot = await getDocs(collection(db, `${dateStr}/${city}/jobs`))
  const jobs = assembleJobObject(querySnapshot)
  console.log(`There are ${jobs.length} jobs in ${city} ${slugs[slug as string]}`)
  // Pass collection data to the page via props
  return { props: { jobs } }
}

const assembleJobObject = (snapshot: QuerySnapshot) => {
  return snapshot.docs.map((doc) => {
    const { company, createdAt, link, loc, remote, salary, skills, title } = doc.data()
    return {
      company,
      createdAt: createdAt.toDate().getTime(),
      link,
      loc: loc.split('+')[0],
      remote,
      salary,
      skills: categorizeSkills(skills),
      title,
    }
  })
}
