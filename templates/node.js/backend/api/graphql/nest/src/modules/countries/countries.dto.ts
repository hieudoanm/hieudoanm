import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Country {
  @Field()
  public cca2: string;

  @Field()
  public cca3: string;

  @Field()
  public ccn3: string;

  @Field()
  public cioc: string;

  @Field()
  public independent: boolean;

  @Field()
  public status: string;

  @Field()
  public unMember: boolean;

  @Field()
  public region: string;

  @Field()
  public subregion: string;

  @Field()
  public landlocked: boolean;

  @Field()
  public area: number;

  @Field()
  public flag: string;

  @Field()
  public population: number;

  @Field()
  public fifa: string;

  @Field()
  public startOfWeek: string;
}
