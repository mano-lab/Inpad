import { getFolderTreeData, FolderTree, isDuplicateFolderPathname, getUpdateFolderTreeInfo, UpdateFolderTreeInfo } from '../folderTree'
import { PopulatedFolderDoc } from '../db/types'
import { getNow } from '../db/utils'

describe('getFolderTreeData', () => {
  it('returns correct folder trees', () => {
    const now = getNow()
    const folderArray: PopulatedFolderDoc[] = [
      {
        _id: '',
        _rev: '',
        createdAt: now,
        updatedAt: now,
        data: {},
        noteIdSet: new Set([]),
        pathname: '/testA',
        order: 1,
      },
      {
        _id: '',
        _rev: '',
        createdAt: now,
        updatedAt: now,
        data: {},
        noteIdSet: new Set([]),
        pathname: '/testA/testA-B',
        order: 3,
      },
      {
        _id: '',
        _rev: '',
        createdAt: now,
        updatedAt: now,
        data: {},
        noteIdSet: new Set([]),
        pathname: '/testA/testA-A',
        order: 2,
      },
      {
        _id: '',
        _rev: '',
        createdAt: now,
        updatedAt: now,
        data: {},
        noteIdSet: new Set([]),
        pathname: '/testA/testA-B/testA-B-A',
        order: 4,
      },
      {
        _id: '',
        _rev: '',
        createdAt: now,
        updatedAt: now,
        data: {},
        noteIdSet: new Set([]),
        pathname: '/testB',
        order: 5,
      },
    ]
    const expectFolderTreeData: FolderTree[] = [
      {
        title: 'testA',
        pathname: '/testA',
        children: [
          {
            title: 'testA-A',
            pathname: '/testA/testA-A',
            children: [],
            expanded: false,
          },
          {
            title: 'testA-B',
            pathname: '/testA/testA-B',
            children: [
              {
                title: 'testA-B-A',
                pathname: '/testA/testA-B/testA-B-A',
                children: [],
                expanded: false,
              }
            ],
            expanded: true,
          }
        ],
        expanded: true,
      },
      {
        title: 'testB',
        pathname: '/testB',
        children: [],
        expanded: false,
      },
    ]
    expect(getFolderTreeData(folderArray)).toStrictEqual(expectFolderTreeData)
  })
})

describe('isDuplicateFolderPathname', () => {
  it('returns true when duplicate pathnames exist', () => {
    const duplicatedFolderTree: FolderTree[] = [
      {
        title: 'testA',
        pathname: '/testA',
        children: [
          {
            title: 'testA-A',
            pathname: '/testA/testA-A',
            children: [],
            expanded: false,
          },
          {
            title: 'testA-A',
            pathname: '/testA/testA-B',
            children: [],
            expanded: false,
          }
        ],
        expanded: true,
      },
    ]
    expect(isDuplicateFolderPathname(duplicatedFolderTree)).toBeTruthy()
  })

  it('returns false when duplicate pathnames do not exist', () => {
    const uniqueFolderTree: FolderTree[] = [
      {
        title: 'testA',
        pathname: '/testA',
        children: [
          {
            title: 'testA-A',
            pathname: '/testA/testA-A',
            children: [],
            expanded: false,
          },
          {
            title: 'testA-B',
            pathname: '/testA/testA-B',
            children: [],
            expanded: false,
          }
        ],
        expanded: true,
      },
    ]
    expect(isDuplicateFolderPathname(uniqueFolderTree)).toBeFalsy()
  })
})

describe('getUpdateFolderTreeInfo', () => {
  it('returns correct UpdateFolderTreeInfo arrat', async () => {
    const folderTreeA: FolderTree[] = [
      {
        title: 'testA',
        pathname: '/testA',
        children: [
          {
            title: 'testA-A',
            pathname: '/testA/testA-A',
            children: [],
            expanded: false,
          },
          {
            title: 'testA-B',
            pathname: '/testA/testA-B',
            children: [
              {
                title: 'testA-B-A',
                pathname: '/testA/testA-B/testA-B-A',
                children: [],
                expanded: false,
              },
            ],
            expanded: true,
          },
        ],
        expanded: true,
      },
      {
        title: 'testB',
        pathname: '/testB',
        children: [],
        expanded: false,
      },
    ]
    const folderTreeB: FolderTree[] = [
      {
        title: 'testA-A',
        pathname: '/testA/testA-A',
        children: [
          {
            title: 'testA-B-A',
            pathname: '/testA/testA-B/testA-B-A',
            children: [
              {
                title: 'testB',
                pathname: '/testB',
                children: [],
                expanded: false,
              },
            ],
            expanded: true,
          },
        ],
        expanded: false,
      },
      {
        title: 'testA',
        pathname: '/testA',
        children: [
          {
            title: 'testA-B',
            pathname: '/testA/testA-B',
            children: [],
            expanded: false,
          },
        ],
        expanded: true,
      },
    ]
    const expectedUpdateFolderTreeInfoA: UpdateFolderTreeInfo[] = [
      {
        newPathname: '',
        oldPathname: '/testA',
        order: 1,
        swapTargetPathname: '',
      },
      {
        newPathname: '',
        oldPathname: '/testB',
        order: 5,
        swapTargetPathname: '',
      },
      {
        newPathname: '',
        oldPathname: '/testA/testA-A',
        order: 2,
        swapTargetPathname: '',
      },
      {
        newPathname: '',
        oldPathname: '/testA/testA-B',
        order: 3,
        swapTargetPathname: '',
      },
      {
        newPathname: '',
        oldPathname: '/testA/testA-B/testA-B-A',
        order: 4,
        swapTargetPathname: '',
      },
    ]
    const expectedUpdateFolderTreeInfoB: UpdateFolderTreeInfo[] = [
      {
        newPathname: '',
        oldPathname: '/testA',
        order: 4,
        swapTargetPathname: '',
      },
      {
        newPathname: '/testA-A',
        oldPathname: '/testA/testA-A',
        order: 1,
        swapTargetPathname: '',
      },
      {
        newPathname: '',
        oldPathname: '/testA/testA-B',
        order: 5,
        swapTargetPathname: '',
      },
      {
        newPathname: '/testA-A/testA-B-A',
        oldPathname: '/testA/testA-B/testA-B-A',
        order: 2,
        swapTargetPathname: '',
      },
      {
        newPathname: '/testA-A/testA-B-A/testB',
        oldPathname: '/testB',
        order: 3,
        swapTargetPathname: '',
      },
    ]
    expect(await getUpdateFolderTreeInfo(folderTreeA)).toStrictEqual(
      expectedUpdateFolderTreeInfoA
    )
    expect(await getUpdateFolderTreeInfo(folderTreeB)).toStrictEqual(
      expectedUpdateFolderTreeInfoB
    )
  })
})
