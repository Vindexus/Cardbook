
import { Card } from './Card';

type Props = {
		items: {id: string}[]
}

export const CardList = (data: Props) => {
	return <div>
		{data.items.map((item) => {
			return <Card key={item.id} {...item} />
		})}
	</div>
}