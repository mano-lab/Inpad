import React from 'react'
import styled from '../../../lib/styled'
import { DndProvider } from 'react-dnd'
import { BackendFactory } from 'dnd-core'
import { SortableTreeWithoutDndContext as SortableTree } from 'react-sortable-tree';
import FileExplorerTheme from 'react-sortable-tree-theme-file-explorer'
import { FolderTree } from '../../../lib/folderTree'
import Spinner from '../../atoms/Spinner';

const FolderListContainer = styled.div`
  height: 300px;
`

type FolderListProps = {
  folderTreeData: FolderTree[]
  handleFolderTreeDataUpdated: (treeData: FolderTree[]) => void
  backend: BackendFactory
  isRearranging: boolean
}

const FolderList = ({
  backend,
  folderTreeData,
  handleFolderTreeDataUpdated,
  isRearranging,
}: FolderListProps) => {
  return (
    <FolderListContainer>
      {isRearranging ? (
        <>
          <Spinner /> Loading...
        </>
      ) : (
        <DndProvider backend={backend}>
          <SortableTree
            treeData={folderTreeData}
            onChange={handleFolderTreeDataUpdated}
            theme={FileExplorerTheme}
            generateNodeProps={(rowInfo) => ({
              icons: [
                <div
                  style={{
                    borderLeft: 'solid 8px gray',
                    borderBottom: 'solid 10px gray',
                    marginRight: 10,
                    boxSizing: 'border-box',
                    width: 16,
                    height: 12,
                    filter: rowInfo.node.expanded
                      ? 'drop-shadow(1px 0 0 gray) drop-shadow(0 1px 0 gray) drop-shadow(0 -1px 0 gray) drop-shadow(-1px 0 0 gray)'
                      : 'none',
                    borderColor: rowInfo.node.expanded ? 'white' : 'gray',
                  }}
                />,
              ],
            })}
          />
        </DndProvider>
      )}
    </FolderListContainer>
  )
}

export default FolderList
