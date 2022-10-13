import { useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { db } from '../../firebase'
import { collection, getDocs, QuerySnapshot } from 'firebase/firestore/lite'

export const cities = ['SF', 'SJ', 'SEA', 'LA']

type Job = {
  companyName: string
  companyLocation: string
  jobLink: string
  jobTitle: string
  salary: string
  skills: string[]
}
type Jobs = {
  todayJobs: Array<Job>
  yesterdayJobs: Array<Job>
  twoDaysAgoJobs: Array<Job>
}

export default function JobPosts({ todayJobs, yesterdayJobs, twoDaysAgoJobs }: Jobs) {
  const router = useRouter()
  const [time, setTime] = useState(0)
  const { city } = router.query
  const tabs = [
    { title: 'Within 24 hours', jobs: todayJobs },
    { title: '24 - 48 hours', jobs: yesterdayJobs },
    { title: '48 - 72 hours', jobs: twoDaysAgoJobs },
  ]

  return (
    <div>
      <div className="text-sm font-medium text-center py-2 text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          {tabs.map(({ title }, i) => {
            const currentTab = i === time
            return (
              <li className="mr-2" key={i}>
                <a
                  onClick={() => setTime(i)}
                  className={`inline-block p-4 rounded-t-lg border-b-2 cursor-pointer ${
                    currentTab
                      ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  } `}
                >
                  {title}
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold ml-2 px-1 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                    {tabs[i].jobs.length}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="py-3 px-6">
                Company name
              </th>
              <th scope="col" className="py-3 px-6">
                Title
              </th>
              <th scope="col" className="py-3 px-6">
                Location
              </th>
              <th scope="col" className="py-3 px-6">
                Salary
              </th>
              <th scope="col" className="py-3 px-6">
                Skills
              </th>
              <th scope="col" className="py-3 px-6"></th>
            </tr>
          </thead>
          <tbody>
            {tabs[time].jobs.map((job, i) => {
              const { companyName, companyLocation, jobLink, jobTitle, salary, skills } = job
              return (
                <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700" key={i}>
                  <th
                    scope="row"
                    className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {companyName}
                  </th>
                  <td className="py-4 px-6">{jobTitle}</td>
                  <td className="py-4 px-6">{companyLocation.split('+')[0]}</td>
                  <td className="py-4 px-6">{salary}</td>
                  <td className="py-4 px-6 max-w-lg flex flex-wrap">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-800 text-xs font-semibold mr-2 my-0.5 px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={jobLink}
                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      Details
                    </a>
                  </td>
                </tr>
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
  // Get the paths we want to pre-render based on posts
  const paths = cities.map((city) => ({
    params: { city },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

// This also gets called at build time
export const getStaticProps: GetStaticProps = async (context) => {
  const { city } = context.params
  const today = new Date()
  let [todayStr, yesterdayStr, twoDaysAgoStr] = convertDateToPreviousDays(today)
  let todayQuerySnapshot = await getDocs(collection(db, `indeed-${city}-${todayStr}`))
  if (todayQuerySnapshot.size === 0) {
    today.setDate(today.getDate() - 1)
    todayStr = convertDateToPreviousDays(today)[0]
    yesterdayStr = convertDateToPreviousDays(today)[1]
    twoDaysAgoStr = convertDateToPreviousDays(today)[2]
    todayQuerySnapshot = await getDocs(collection(db, `indeed-${city}-${todayStr}`))
  }

  const yesterdayQuerySnapshot = await getDocs(collection(db, `indeed-${city}-${yesterdayStr}`))
  const twoDaysAgoQuerySnapshot = await getDocs(collection(db, `indeed-${city}-${twoDaysAgoStr}`))

  const todayJobs = assembleJobObject(todayQuerySnapshot)
  const yesterdayJobs = assembleJobObject(yesterdayQuerySnapshot)
  const twoDaysAgoJobs = assembleJobObject(twoDaysAgoQuerySnapshot)
  console.log(`There are ${todayQuerySnapshot.size} jobs in ${city} today`)
  // Pass collection data to the page via props
  return { props: { todayJobs, yesterdayJobs, twoDaysAgoJobs } }
}

const assembleJobObject = (snapshot: QuerySnapshot) => {
  return snapshot.docs.map((doc) => {
    const { companyName, companyLocation, jobLink, jobTitle, salary, skills } = doc.data()
    return { companyName, companyLocation, jobLink, jobTitle, salary, skills }
  })
}

const convertDateToString = (date: Date) => {
  return date.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const convertDateToPreviousDays = (today: Date) => {
  const todayStr = convertDateToString(today)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = convertDateToString(yesterday)

  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const twoDaysAgoStr = convertDateToString(twoDaysAgo)
  return [todayStr, yesterdayStr, twoDaysAgoStr]
}
